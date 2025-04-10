from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import logging
import os
import uuid
import time
from typing import List, Dict, Any, Optional
from bson import ObjectId, json_util
import json
from datetime import datetime
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

logger = logging.getLogger(__name__)

# Directory structure for data
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "data")
CONVERSATION_DIR = os.path.join(DATA_DIR, "conversation")
# Ensure directory exists
os.makedirs(CONVERSATION_DIR, exist_ok=True)

router = APIRouter(prefix="/conversation", tags=["Conversation"])

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

def build_prompt(user_message: str, conversation_messages: List[Dict[str, Any]], agent_config: Dict[str, Any], tts_instructions: Optional[str] = None) -> str:
    """Build a prompt for the LLM using the conversation history and agent personality."""
    # Serialize agent_config using json_util
    agent_config_bson = json_util.dumps(agent_config)
    agent_config_json = json.loads(agent_config_bson)
    
    # Use the PromptBuilder to create a prompt
    return PromptBuilder.create_prompt(
        personality_prompt=agent_config_json["personality_prompt"],
        messages=conversation_messages,
        current_message=user_message,
        tts_instructions=tts_instructions
    )

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_new_conversation(
    conv_data: ConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new conversation."""
    try:
        # Get user ID from current user
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        conversation = await create_conversation(
            user_uid=user_uid,
            title=conv_data.title,
            agent_uid=conv_data.agent_uid
        )
        logger.info(f"Conversation created: {conv_data.title}")
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
        
        # Validate conversation
        conversation = await get_conversation(message_data.conversation_uid)
        if not conversation:
            logger.warning(f"Conversation not found: {message_data.conversation_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
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
        
        # Add user message to the conversation
        user_message = await add_message(
            conversation_uid=message_data.conversation_uid,
            content=message_data.content,
            message_type=MessageType.USER
        )
        
        # Get conversation history
        conversation_messages = await get_conversation_messages(message_data.conversation_uid)
        
        # Process the message and generate a response
        # Use a background task for the agent response to avoid blocking
        background_tasks.add_task(
            process_agent_response,
            conversation_uid=message_data.conversation_uid,
            user_message=user_message["content"],
            conversation_messages=conversation_messages,
            start_time=start_time
        )
        
        logger.info(f"User message sent and agent response processing started for conversation: {message_data.conversation_uid}")
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
        # Get conversation history
        conversation = await get_conversation(conversation_uid)
        agent_uid = conversation.get("agent_uid")
        
        # Get conversation messages if not provided
        if conversation_messages is None:
            conversation_messages = await get_conversation_messages(conversation_uid)
        
        # Format messages for prompt
        agent_config = await get_agent(agent_uid)
        
        # Properly serialize MongoDB documents using json_util
        conversation_messages_bson = json_util.dumps(conversation_messages)
        conversation_messages_json = json.loads(conversation_messages_bson)
        
        # Get LLM config for the agent
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
        
        # Build the prompt with TTS instructions
        prompt = build_prompt(user_message, conversation_messages_json, agent_config, tts_instructions)
        
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
        
        # Generate a unique ID for the message
        message_uid = str(uuid.uuid4())
        
        # Generate voice for the response
        voice_path, audio_duration = await generate_voice(
            text=response_text,
            voice_speaker=agent_config["voice_speaker"],
            message_uid=message_uid,
            conversation_uid=conversation_uid
        )
        logger.info(f"Generated voice for message: {message_uid}")
        
        # Calculate response time - MOVED HERE to include TTS generation time
        response_time = None
        if start_time:
            response_time = time.time() - start_time
            logger.info(f"Total response time (including TTS): {response_time:.2f} seconds")
        
        # Convert BSON ObjectId to string for agent_uid and llm_config_uid
        agent_id = str(agent_uid) if isinstance(agent_uid, ObjectId) else agent_uid
        
        # Handle llm_config_uid properly - extract from the serialized JSON data
        llm_config_id = None
        if "llm_config_uid" in llm_config_json:
            llm_config_id = str(llm_config_json["llm_config_uid"]) if isinstance(llm_config_json["llm_config_uid"], (ObjectId, str)) else llm_config_json["llm_config_uid"]
        elif "config_uid" in llm_config_json:
            llm_config_id = str(llm_config_json["config_uid"]) if isinstance(llm_config_json["config_uid"], (ObjectId, str)) else llm_config_json["config_uid"]
        
        # Add response time and audio duration as metadata
        metadata = {}
        if response_time:
            metadata["response_time"] = f"{response_time:.2f}"
        if audio_duration:
            metadata["audio_duration"] = f"{audio_duration:.2f}"
        
        # Add agent message to the conversation
        await add_message(
            conversation_uid=conversation_uid,
            content=response_text,
            message_type=MessageType.AGENT,
            message_uid=message_uid,
            voiceline_path=voice_path,
            agent_uid=agent_id,
            llm_config_uid=llm_config_id,
            metadata=metadata
        )
        
        logger.info(f"Agent response added to conversation: {conversation_uid}")
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