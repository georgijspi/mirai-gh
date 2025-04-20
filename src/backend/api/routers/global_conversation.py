from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import logging
import os
import uuid
import time
import re
from typing import List, Dict, Any, Optional
from bson import ObjectId, json_util
import json
from datetime import datetime

from ..models import (
    GlobalSendMessageRequest,
    GlobalMessageResponse,
    GlobalConversationResponse,
    GlobalMessageRateRequest,
    MessageType,
    MessageRating,
    StatusResponse
)
from ..security import get_current_user
from ..services.global_conversation_service import (
    get_or_create_global_conversation,
    get_global_conversation_with_messages,
    add_message_to_global_conversation,
    get_global_message,
    update_global_message_rating
)
from ..services.agent_service import get_agent, get_all_agents
from ..services.llm_service import get_llm_config, generate_text
from ..services.tts_service import generate_voice
from promptBuilderModule.prompt_builder import PromptBuilder
from ..database import db, pubsub_client
from ..services.rag_service import augment_conversation_context

logger = logging.getLogger(__name__)

# Directory structure for data
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "data")
CONVERSATION_DIR = os.path.join(DATA_DIR, "conversation")
GLOBAL_CONVERSATION_DIR = os.path.join(CONVERSATION_DIR, "global")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CONVERSATION_DIR, exist_ok=True)
os.makedirs(GLOBAL_CONVERSATION_DIR, exist_ok=True)

# Collection name for global messages
GLOBAL_MESSAGE_COLLECTION = "global_messages"

router = APIRouter(prefix="/global_conversation", tags=["Global Conversation"])

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

def build_global_prompt(user_message: str, agent_name: str, conversation_messages: List[Dict[str, Any]], agent_config: Dict[str, Any], tts_instructions: Optional[str] = None, rag_context: Optional[str] = None) -> str:
    """Build a prompt for the global conversation with very clear instructions."""
    # Serialize agent_config using json_util
    agent_config_bson = json_util.dumps(agent_config)
    agent_config_json = json.loads(agent_config_bson)
    
    # Limit to recent messages to prevent context overload
    recent_messages = conversation_messages[-8:] if len(conversation_messages) > 8 else conversation_messages
    
    # The final system prompt will combine several sections
    system_prompt_parts = []
    
    # 1. Basic identity and role instruction
    system_prompt_parts.append(f"""## AGENT IDENTITY
You are {agent_name}. You must stay in character as {agent_name} at all times.

## CORE PERSONALITY
{agent_config_json['personality_prompt']}""")
    
    # 2. Global conversation context
    system_prompt_parts.append("""## GLOBAL CHAT CONTEXT
You are in a group conversation where users can address different AI assistants by name.
You should ONLY respond when addressed by your name.
The current message is specifically directed to YOU.""")
    
    # 3. If RAG context is available, add it with clear instructions
    if rag_context:
        system_prompt_parts.append(f"""## SEARCH RESULTS
{rag_context}""")
        
    # 4. Add explicit instructions for the current query
    system_prompt_parts.append(f"""## CURRENT QUERY
The user has asked you: "{user_message}"

## RESPONSE INSTRUCTIONS
1. Provide a direct, factual response to the query
2. Maintain your character voice and personality
3. Focus ONLY on the current query
4. If search results are provided above, use that factual information in your response
5. DO NOT mention the search process in your response
6. DO NOT give safety warnings unless specifically asked about dangerous topics
7. Be helpful, accurate, and stay in character

## IMPORTANT
Your response should be informative but concise, factually accurate, and in your character's voice.""")
    
    # 5. Add TTS instructions if provided
    if tts_instructions:
        system_prompt_parts.append(f"""## TTS INSTRUCTIONS
{tts_instructions}""")

    # Combine all parts with proper spacing
    personality = "\n\n".join(system_prompt_parts)
    
    # Build the prompt with minimal conversation history to keep focus on the current question
    return PromptBuilder.create_prompt(
        personality_prompt=personality,
        messages=recent_messages[-4:] if len(recent_messages) > 4 else recent_messages,  # Use even fewer messages
        current_message=user_message,
        tts_instructions=None,  # Already included in the personality prompt
        rag_context=None  # Already included in the personality prompt
    )

@router.get("", response_model=GlobalConversationResponse)
async def get_global_conversation(
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get the global conversation with recent messages."""
    try:
        conversation = await get_global_conversation_with_messages(limit=limit, skip=skip)
        logger.info(f"Retrieved global conversation with {len(conversation.get('messages', []))} messages")
        return conversation
    except Exception as e:
        logger.error(f"Error retrieving global conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve global conversation: {str(e)}"
        )

# Add OPTIONS handler for CORS preflight requests
@router.options("", include_in_schema=False)
async def options_global_conversation():
    """Handle CORS preflight requests for the global conversation endpoint."""
    return {}

@router.post("/send_message", response_model=GlobalMessageResponse)
async def send_global_message(
    message_data: GlobalSendMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send a message to the global conversation."""
    try:
        user_uid = current_user.get("user_uid") if isinstance(current_user, dict) else current_user.user_uid
        
        user_message = await add_message_to_global_conversation(
            content=message_data.content,
            message_type=MessageType.USER
        )
        
        agent_uid = message_data.agent_uid
        
        if not agent_uid:
            # Identify which agent the message is directed to by looking for "Hey [Name]" or similar patterns
            agent_mention_pattern = r"(?:hey|hi|hello|ok|okay)\s+(\w+)"
            matches = re.findall(agent_mention_pattern, message_data.content, re.IGNORECASE)
            
            if matches:
                mentioned_name = matches[0].lower()
                
                agents = await get_all_agents(include_archived=False)
                
                # Try to find a matching agent
                for agent in agents:
                    agent_name = agent["name"].lower()
                    # Check if the mentioned name is part of the agent name
                    if mentioned_name in agent_name.split():
                        agent_uid = agent["agent_uid"]
                        logger.info(f"Detected agent mention: {mentioned_name}, matching to agent: {agent['name']}")
                        break
        
        if not agent_uid:
            logger.info("No agent specified or detected in message, not generating a response")
            return user_message
        
        start_time = time.time()
        
        # Process the message and generate a response in the background
        logger.info(f"Starting background task for global conversation with agent {agent_uid}")
        background_tasks.add_task(
            process_agent_global_response,
            user_message=message_data.content,
            agent_uid=agent_uid,
            start_time=start_time
        )
        
        logger.info(f"User message sent and agent response processing started for global conversation")
        return user_message
    except Exception as e:
        logger.error(f"Error sending global message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )

# Add OPTIONS handler for CORS preflight requests
@router.options("/send_message", include_in_schema=False)
async def options_send_message():
    """Handle CORS preflight requests for the send_message endpoint."""
    return {}

async def process_agent_global_response(
    user_message: str,
    agent_uid: str,
    start_time: float = None
):
    """Process an agent response to a user message in the global conversation."""
    try:
        # Get the agent configuration
        agent_config = await get_agent(agent_uid)
        if not agent_config:
            logger.error(f"Agent not found: {agent_uid}")
            return
        
        agent_name = agent_config["name"]
        logger.info(f"Processing response from agent: {agent_name}")
        
        conversation = await get_global_conversation_with_messages(limit=20)
        conversation_messages = conversation.get("messages", [])
        
        # Ensure all messages have the correct conversation_uid
        for message in conversation_messages:
            message["conversation_uid"] = "global"
        
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
        
        tts_instructions = llm_config_json.get("tts_instructions")
        
        rag_context = None
        
        # Augment context with RAG if needed
        rag_result = await augment_conversation_context(conversation_messages_json, user_message)
        if rag_result["rag_applied"] and rag_result["system_message"]:
            rag_context = rag_result["system_message"]["content"]
            logger.info(f"RAG applied to global conversation query: {user_message}")
            if "search_terms" in rag_result and rag_result["search_terms"]:
                logger.info(f"Search terms used for RAG: {rag_result['search_terms']}")
        
        # Build the prompt with TTS instructions, agent name, and RAG context for the global conversation
        prompt = build_global_prompt(user_message, agent_name, conversation_messages_json, agent_config, tts_instructions, rag_context)
        
        message_uid = str(uuid.uuid4())
        
        # Save the prompt to a file
        prompt_path = None
        try:
            os.makedirs(GLOBAL_CONVERSATION_DIR, exist_ok=True)
            prompt_path = os.path.join(GLOBAL_CONVERSATION_DIR, f"prompt_{message_uid}.txt")
            
            with open(prompt_path, 'w', encoding='utf-8') as f:
                f.write(prompt)
            logger.info(f"Saved global conversation prompt to file: {prompt_path}")
        except Exception as e:
            logger.error(f"Failed to save global conversation prompt to file: {str(e)}")
        
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
        logger.info(f"Generated response from {agent_name} for global conversation")
        
        custom_voice_path = agent_config.get("custom_voice_path")
        if custom_voice_path:
            logger.info(f"Agent has custom voice path: {custom_voice_path}")
        
        # Generate voice for the response
        voice_path, audio_duration = await generate_voice(
            text=response_text,
            voice_speaker=agent_config["voice_speaker"],
            message_uid=message_uid,
            conversation_uid="global",
            custom_voice_path=custom_voice_path
        )
        logger.info(f"Generated voice at path: {voice_path}")
        
        response_time = None
        if start_time:
            response_time = time.time() - start_time
            logger.info(f"Total response time (including TTS): {response_time:.2f} seconds")
        
        # Convert BSON ObjectId to string for agent_uid and llm_config_uid
        agent_id = str(agent_uid) if isinstance(agent_uid, ObjectId) else agent_uid
        
        # Handle llm_config_uid properly
        llm_config_id = None
        if "llm_config_uid" in llm_config_json:
            llm_config_id = str(llm_config_json["llm_config_uid"]) if isinstance(llm_config_json["llm_config_uid"], (ObjectId, str)) else llm_config_json["llm_config_uid"]
        elif "config_uid" in llm_config_json:
            llm_config_id = str(llm_config_json["config_uid"]) if isinstance(llm_config_json["config_uid"], (ObjectId, str)) else llm_config_json["config_uid"]
        
        # Generate a stream URL for the audio
        audio_stream_url = f"/mirai/api/tts/stream/{message_uid}?conversation_uid=global"
        
        # Add response time and audio duration as metadata
        metadata = {
            "agent_name": agent_name
        }
        
        if response_time:
            metadata["response_time"] = f"{response_time:.2f}"
        if audio_duration:
            metadata["audio_duration"] = f"{audio_duration:.2f}"
            
        # If RAG was applied, include that in the metadata
        if rag_context:
            metadata["rag_applied"] = True
            metadata["query_type"] = rag_result["query_type"]
            metadata["search_results_count"] = len(rag_result["search_results"])
        
        # Add prompt path to metadata
        if prompt_path:
            metadata["prompt_path"] = prompt_path
        
        # Add agent message to the global conversation
        agent_message = await add_message_to_global_conversation(
            content=response_text,
            message_type=MessageType.AGENT,
            message_uid=message_uid,
            voiceline_path=voice_path,
            agent_uid=agent_id,
            llm_config_uid=llm_config_id,
            metadata=metadata
        )
        
        # Add the stream URL to the response
        agent_message["audio_stream_url"] = audio_stream_url
        
        # Update the message in the database with the audio_stream_url and prompt_path
        if db is not None:
            try:
                update_fields = {"audio_stream_url": audio_stream_url}
                if prompt_path:
                    update_fields["prompt_path"] = prompt_path
                
                await db[GLOBAL_MESSAGE_COLLECTION].update_one(
                    {"message_uid": message_uid},
                    {"$set": update_fields}
                )
                logger.info(f"Updated message {message_uid} with audio_stream_url and prompt_path in database")
            except Exception as e:
                logger.error(f"Failed to update message in database: {e}")
                # Continue execution - this is not critical
        else:
            logger.warning(f"Database connection not available, couldn't update message {message_uid} with audio_stream_url and prompt_path")
        
        # Publish the agent's message to a message queue for websocket notifications
        if pubsub_client:
            try:
                # Create a simplified version of the message that's guaranteed to be JSON serializable
                serializable_message = {
                    "type": "agent_response",
                    "message": {
                        "message_uid": message_uid,
                        "content": response_text,
                        "message_type": "agent",
                        "audio_stream_url": audio_stream_url,
                        "metadata": metadata,
                        "conversation_uid": "global",
                        "agent_uid": agent_id
                    },
                    "conversation_uid": "global"
                }
                
                await pubsub_client.publish(
                    "global_conversation:messages",
                    json.dumps(serializable_message, cls=JSONEncoder)
                )
                logger.info(f"Published global agent response from {agent_name}")
            except Exception as e:
                logger.error(f"Failed to publish global agent response: {str(e)}")
                import traceback
                logger.error(f"Publish error traceback: {traceback.format_exc()}")
        
        logger.info(f"Agent {agent_name} response added to global conversation")
        
        return agent_message
    except Exception as e:
        logger.error(f"Error processing agent response for global conversation: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())

@router.post("/rate_message", response_model=GlobalMessageResponse)
async def rate_global_message(
    rating_data: GlobalMessageRateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rate a message in the global conversation."""
    try:
        # Get the message to ensure it exists
        message = await get_global_message(rating_data.message_uid)
        if not message:
            logger.warning(f"Message not found: {rating_data.message_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        # Update the message rating
        updated_message = await update_global_message_rating(rating_data.message_uid, rating_data.rating)
        if not updated_message:
            logger.warning(f"Failed to update message rating: {rating_data.message_uid}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update message rating"
            )
        
        logger.info(f"Global message {rating_data.message_uid} rated as {rating_data.rating}")
        return updated_message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rating global message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rate message: {str(e)}"
        )
