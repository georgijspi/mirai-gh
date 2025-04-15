from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import logging
import os
import uuid
import time
from typing import List, Dict, Any, Optional
from bson import ObjectId, json_util
import json
from datetime import datetime, timezone
from fastapi.responses import JSONResponse

from ..models import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    SendMessageRequest,
    RateMessageRequest,
    MessageResponse,
    MessageType,
    StatusResponse
)
from ..security import get_current_user
from ..services.conversation_service import (
    create_conversation,
    get_conversation,
    get_conversation_with_messages,
    get_user_conversations,
    update_conversation,
    archive_conversation,
    add_message,
    get_message,
    update_message_rating,
    get_conversation_messages
)
from ..services.agent_service import get_agent
from ..services.llm_service import get_llm_config, generate_text
from ..services.tts_service import generate_voice
from promptBuilderModule.prompt_builder import PromptBuilder
from ..database import db, pubsub_client
from ..services.rag_service import augment_conversation_context

logger = logging.getLogger(__name__)

# Directory structure for data
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "data")
CONVERSATION_DIR = os.path.join(DATA_DIR, "conversation")

os.makedirs(CONVERSATION_DIR, exist_ok=True)

MESSAGE_COLLECTION = "messages"

router = APIRouter(prefix="/conversation", tags=["Conversation"])

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

def build_prompt(user_message: str, conversation_messages: List[Dict[str, Any]], agent_config: Dict[str, Any], tts_instructions: Optional[str] = None, rag_context: Optional[str] = None) -> str:
    """Build a prompt for the LLM using the conversation history and agent personality."""
    # Serialize agent_config using json_util
    agent_config_bson = json_util.dumps(agent_config)
    agent_config_json = json.loads(agent_config_bson)
    
    # Limit conversation history to last 6 messages to keep the context focused
    recent_messages = conversation_messages[-6:] if len(conversation_messages) > 6 else conversation_messages
    
    return PromptBuilder.create_prompt(
        personality_prompt=agent_config_json["personality_prompt"],
        messages=recent_messages,
        current_message=user_message,
        tts_instructions=tts_instructions,
        rag_context=rag_context
    )

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_new_conversation(
    conv_data: ConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new conversation with optional title. If no title is provided, one will be auto-generated based on agent name and current date."""
    try:
        # Get user ID from current user
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        # Get the agent_uid from request
        agent_uid = conv_data.agent_uid
        
        # Pass title to create_conversation
        title = conv_data.title if hasattr(conv_data, 'title') and conv_data.title else None
        
        conversation = await create_conversation(
            user_uid=user_uid,
            title=title,
            agent_uid=agent_uid
        )
        logger.info(f"Conversation created: {conversation['title']}")
        return conversation
    except ValueError as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}"
        )

@router.get("/list", response_model=ConversationListResponse)
async def list_conversations(
    include_archived: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """List all conversations for the current user."""
    try:
        # Get user ID from current user
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        conversations = await get_user_conversations(user_uid, include_archived)
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list conversations: {str(e)}"
        )

@router.get("/{conversation_uid}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    conversation_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a conversation with all messages."""
    try:
        # Get user ID from current user
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        conversation = await get_conversation_with_messages(conversation_uid)
        if not conversation:
            logger.warning(f"Conversation not found: {conversation_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Check if the conversation belongs to the current user
        if conversation["user_uid"] != user_uid:
            logger.warning(f"User {user_uid} tried to access conversation {conversation_uid} belonging to {conversation['user_uid']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this conversation"
            )
        
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation: {str(e)}"
        )

@router.put("/{conversation_uid}", response_model=ConversationResponse)
async def update_conversation_details(
    conversation_uid: str,
    conv_data: ConversationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a conversation."""
    try:
        # Get user ID from current user
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        # Check if the conversation belongs to the current user
        conversation = await get_conversation(conversation_uid)
        if not conversation:
            logger.warning(f"Conversation not found: {conversation_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        if conversation["user_uid"] != user_uid:
            logger.warning(f"User {user_uid} tried to update conversation {conversation_uid} belonging to {conversation['user_uid']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this conversation"
            )
        
        # Filter out None values
        update_data = {k: v for k, v in conv_data.dict().items() if v is not None}
        
        updated_conversation = await update_conversation(conversation_uid, update_data)
        logger.info(f"Conversation updated: {updated_conversation['title']}")
        
        return updated_conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update conversation: {str(e)}"
        )

@router.delete("/{conversation_uid}", response_model=StatusResponse)
async def archive_conversation_by_id(
    conversation_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """Archive a conversation."""
    try:
        # Get user ID from current user
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        # Check if the conversation belongs to the current user
        conversation = await get_conversation(conversation_uid)
        if not conversation:
            logger.warning(f"Conversation not found: {conversation_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        if conversation["user_uid"] != user_uid:
            logger.warning(f"User {user_uid} tried to archive conversation {conversation_uid} belonging to {conversation['user_uid']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to archive this conversation"
            )
        
        success = await archive_conversation(conversation_uid)
        logger.info(f"Conversation archived: {conversation_uid}")
        
        return {"status": "success", "message": "Conversation archived successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive conversation: {str(e)}"
        )

@router.post("/send_message", response_model=MessageResponse)
async def send_message(
    message_data: SendMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send a message in a conversation and get a response from the agent."""
    try:
        # Get user ID from current user
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        logger.info(f"Received message request for conversation: {message_data.conversation_uid}")
        
        # Validate conversation
        conversation = await get_conversation(message_data.conversation_uid)
        if not conversation:
            logger.warning(f"Conversation not found: {message_data.conversation_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        logger.info(f"Found conversation in DB with uid: {conversation.get('conversation_uid')}")
        
        # Check if the conversation belongs to the current user
        if conversation["user_uid"] != user_uid:
            logger.warning(f"User {user_uid} tried to send message to conversation {message_data.conversation_uid} belonging to {conversation['user_uid']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to send messages to this conversation"
            )
        
        # Get the agent for the conversation
        agent = await get_agent(conversation["agent_uid"])
        if not agent:
            logger.error(f"Agent not found for conversation: {message_data.conversation_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found for this conversation"
            )
        
        # Get LLM config for the agent
        llm_config = await get_llm_config(agent["llm_config_uid"])
        if not llm_config:
            logger.error(f"LLM config not found for agent: {agent['name']}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LLM configuration not found for this agent"
            )
        
        # Start response time tracking
        start_time = time.time()
        
        conversation_uid = conversation["conversation_uid"]
        
        # Add user message to the conversation
        logger.info(f"Adding user message to conversation: {conversation_uid}")
        user_message = await add_message(
            conversation_uid=conversation_uid,
            content=message_data.content,
            message_type=MessageType.USER
        )
        
        # Get conversation history
        conversation_messages = await get_conversation_messages(conversation_uid)
        
        # Process the message and generate a response using a background task to avoid blocking
        logger.info(f"Starting background task for conversation: {conversation_uid}")
        background_tasks.add_task(
            process_agent_response,
            conversation_uid=conversation_uid,
            user_message=user_message["content"],
            conversation_messages=conversation_messages,
            start_time=start_time
        )
        
        logger.info(f"User message sent and agent response processing started for conversation: {conversation_uid}")
        return user_message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )

async def process_agent_response(
    conversation_uid: str, 
    user_message: str,
    conversation_messages: Optional[List[Dict[str, Any]]] = None,
    start_time: float = None
):
    """Process an agent response to a user message."""
    try:
        # Log conversation UID to help debug issues
        logger.info(f"Processing agent response for conversation: {conversation_uid}")
        
        # Get conversation history
        conversation = await get_conversation(conversation_uid)
        agent_uid = conversation.get("agent_uid")
        logger.info(f"Retrieved conversation data with agent_uid: {agent_uid}")
        
        # Get conversation messages if not provided
        if conversation_messages is None:
            conversation_messages = await get_conversation_messages(conversation_uid)
        
        agent_config = await get_agent(agent_uid)
        
        # Serialize MongoDB documents using json_util
        conversation_messages_bson = json_util.dumps(conversation_messages)
        conversation_messages_json = json.loads(conversation_messages_bson)
        
        llm_config = await get_llm_config(agent_config["llm_config_uid"])
        if not llm_config:
            logger.error(f"LLM config not found for agent: {agent_config['name']}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LLM configuration not found for this agent"
            )
        
        # Convert entire llm_config to JSON serializable format
        llm_config_bson = json_util.dumps(llm_config)
        llm_config_json = json.loads(llm_config_bson)
        
        # Get TTS instructions from LLM config
        tts_instructions = llm_config_json.get("tts_instructions")
        
        # Augment context with RAG if needed
        rag_result = await augment_conversation_context(conversation_messages_json, user_message)
        rag_context = None

        if rag_result["rag_applied"] and rag_result["system_message"]:
            rag_context = rag_result["system_message"]["content"]
            logger.info(f"RAG applied to query: {user_message}")
            
            metadata = {
                "rag_applied": True,
                "query_type": rag_result["query_type"],
                "search_results_count": len(rag_result["search_results"])
            }
            
            # Update the user message with RAG metadata
            try:
                message_uid = None
                # Find the most recent user message with matching content
                for message in reversed(conversation_messages_json):
                    if message.get("message_type") == MessageType.USER and message.get("content") == user_message:
                        message_uid = message.get("message_uid")
                        break
                
                if message_uid and db is not None:
                    await db[MESSAGE_COLLECTION].update_one(
                        {"message_uid": message_uid},
                        {"$set": {"metadata": metadata}}
                    )
                    logger.info(f"Updated message {message_uid} with RAG metadata")
                else:
                    logger.warning(
                        f"Could not update RAG metadata: " + 
                        ("Message UID not found" if not message_uid else "Database connection unavailable")
                    )
            except Exception as e:
                logger.warning(f"Failed to update message with RAG metadata: {str(e)}")
        
        prompt = build_prompt(user_message, conversation_messages_json, agent_config, tts_instructions, rag_context)
        
        # Generate response from LLM
        response_text = await generate_text(
            model=llm_config_json["model"],
            prompt=prompt,
            temperature=llm_config_json.get("temperature", 0.7),
            top_p=llm_config_json.get("top_p", 0.9),
            top_k=llm_config_json.get("top_k", 40),
            repeat_penalty=llm_config_json.get("repeat_penalty", 1.1),
            max_tokens=llm_config_json.get("max_tokens", 2048),
            presence_penalty=llm_config_json.get("presence_penalty", 0.0),
            frequency_penalty=llm_config_json.get("frequency_penalty", 0.0),
            stop=llm_config_json.get("stop_sequences", [])
        )
        logger.info(f"Generated response for conversation: {conversation_uid}")
        
        # Generate a message uid
        message_uid = str(uuid.uuid4())
        
        logger.info(f"Generating voice for message_uid: {message_uid} in conversation: {conversation_uid}")
        
        # Get custom voice path if exists
        custom_voice_path = agent_config.get("custom_voice_path")
        if custom_voice_path:
            logger.info(f"Agent has custom voice path: {custom_voice_path}")
        
        # Generate wav for the response
        voice_path, audio_duration = await generate_voice(
            text=response_text,
            voice_speaker=agent_config["voice_speaker"],
            message_uid=message_uid,
            conversation_uid=conversation_uid,
            custom_voice_path=custom_voice_path
        )
        logger.info(f"Generated voice at path: {voice_path}")
        
        # Calculate response time
        response_time = None
        if start_time:
            response_time = time.time() - start_time
            logger.info(f"Total response time (including TTS): {response_time:.2f} seconds")
        
        # Generate a stream URL for the audio
        audio_stream_url = f"/mirai/api/tts/stream/{message_uid}?conversation_uid={conversation_uid}"
        
        metadata = {}
        if response_time:
            metadata["response_time"] = f"{response_time:.2f}"
        if audio_duration:
            metadata["audio_duration"] = f"{audio_duration:.2f}"
        
        if rag_context:
            metadata["rag_applied"] = True
            metadata["query_type"] = rag_result["query_type"]
        
        # Add the agent response to the conversation
        agent_message = await add_message(
            conversation_uid=conversation_uid,
            content=response_text,
            message_type=MessageType.AGENT,
            message_uid=message_uid,
            agent_uid=agent_uid,
            llm_config_uid=agent_config["llm_config_uid"],
            voiceline_path=voice_path,
            metadata=metadata
        )
        
        # Add the stream URL to the response
        agent_message["audio_stream_url"] = audio_stream_url
        
        # Update the message in the database with the audio_stream_url
        if db is not None:
            try:
                await db[MESSAGE_COLLECTION].update_one(
                    {"message_uid": message_uid},
                    {"$set": {"audio_stream_url": audio_stream_url}}
                )
                logger.info(f"Updated message {message_uid} with audio_stream_url in database")
            except Exception as e:
                logger.error(f"Failed to update message in database: {e}")
                # Continue execution - this is not critical
        else:
            logger.warning(f"Database connection not available, couldn't update message {message_uid} with audio_stream_url")
        
        logger.info(f"Agent response added to conversation: {conversation_uid}")
        
        # Publish the agent's message to a message queue for websocket notifications
        if pubsub_client:
            try:
                serializable_message = {
                    "type": "agent_response",
                    "message": {
                        "message_uid": message_uid,
                        "content": response_text,
                        "message_type": "agent",
                        "audio_stream_url": audio_stream_url,
                        "metadata": metadata,
                        "conversation_uid": conversation_uid,
                        "agent_uid": agent_uid
                    },
                    "conversation_uid": conversation_uid
                }
                
                await pubsub_client.publish(
                    f"conversation:{conversation_uid}:messages",
                    json.dumps(serializable_message, cls=JSONEncoder)
                )
                logger.info(f"Published agent response for conversation: {conversation_uid}")
            except Exception as e:
                logger.error(f"Failed to publish agent response: {str(e)}")
                import traceback
                logger.error(f"Publish error traceback: {traceback.format_exc()}")
        
        return agent_message
    except Exception as e:
        logger.error(f"Error processing agent response: {str(e)}")
        raise

@router.post("/rate_message", response_model=MessageResponse)
async def rate_message(
    rating_data: RateMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rate a message (like, dislike, or none)."""
    try:
        # Get user ID from current user
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        # Get the message
        message = await get_message(rating_data.message_uid)
        if not message:
            logger.warning(f"Message not found: {rating_data.message_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        # Get the conversation to check ownership
        conversation = await get_conversation(message["conversation_uid"])
        if not conversation:
            logger.warning(f"Conversation not found: {message['conversation_uid']}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Check if the conversation belongs to the current user
        if conversation["user_uid"] != user_uid:
            logger.warning(f"User {user_uid} tried to rate message in conversation belonging to {conversation['user_uid']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to rate messages in this conversation"
            )
        
        # Update the message rating
        updated_message = await update_message_rating(rating_data.message_uid, rating_data.rating)
        if not updated_message:
            logger.warning(f"Failed to update message rating: {rating_data.message_uid}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update message rating"
            )
        
        logger.info(f"Message {rating_data.message_uid} rated as {rating_data.rating}")
        return updated_message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rating message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rate message: {str(e)}"
        ) 