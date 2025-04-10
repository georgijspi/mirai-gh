import uuid
import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

from api.database import get_database
from api.services.agent_service import get_agent
from api.services.llm_service import get_llm_config, generate_text
from api.services.tts_service import generate_speech
from api.models import MessageType, MessageRating

logger = logging.getLogger(__name__)

# Collections
CONVERSATION_COLLECTION = "conversations"
MESSAGE_COLLECTION = "messages"

# Make sure we create the directories if they don't exist
DATA_DIR = os.path.join(os.getcwd(), "..", "data")
CONVERSATION_DIR = os.path.join(DATA_DIR, "conversation")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CONVERSATION_DIR, exist_ok=True)

# Voiceline storage paths
VOICELINE_DIR = os.path.join("ttsModule", "voicelines", "messages")

async def create_conversation(user_uid: str, title: str, agent_uid: str) -> Dict[str, Any]:
    """Create a new conversation."""
    db = get_database()
    
    # Validate that the agent exists
    agent = await get_agent(agent_uid)
    if not agent:
        logger.error(f"Failed to create conversation: Agent {agent_uid} not found")
        raise ValueError(f"Agent with ID {agent_uid} not found")
    
    conversation_uid = str(uuid.uuid4())
    timestamp = datetime.utcnow()
    
    conversation_data = {
        "conversation_uid": conversation_uid,
        "title": title,
        "user_uid": user_uid,
        "agent_uid": agent_uid,
        "is_archived": False,
        "created_at": timestamp,
        "updated_at": timestamp,
        "message_count": 0
    }
    
    await db[CONVERSATION_COLLECTION].insert_one(conversation_data)
    logger.info(f"Created new conversation: {title} for user {user_uid}")
    
    return conversation_data

async def get_conversation(conversation_uid: str) -> Optional[Dict[str, Any]]:
    """Get conversation by ID."""
    db = get_database()
    conversation = await db[CONVERSATION_COLLECTION].find_one({"conversation_uid": conversation_uid})
    return conversation

async def get_conversation_with_messages(conversation_uid: str) -> Optional[Dict[str, Any]]:
    """Get conversation with all messages."""
    db = get_database()
    
    conversation = await get_conversation(conversation_uid)
    if not conversation:
        return None
    
    cursor = db[MESSAGE_COLLECTION].find(
        {"conversation_uid": conversation_uid}
    ).sort("created_at", 1)
    
    messages = await cursor.to_list(length=1000)
    conversation["messages"] = messages
    
    return conversation

async def get_user_conversations(user_uid: str, include_archived: bool = False) -> List[Dict[str, Any]]:
    """Get all conversations for a user."""
    db = get_database()
    
    query = {"user_uid": user_uid}
    if not include_archived:
        query["is_archived"] = False
        
    cursor = db[CONVERSATION_COLLECTION].find(query).sort("updated_at", -1)
    conversations = await cursor.to_list(length=100)
    
    return conversations

async def update_conversation(conversation_uid: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update conversation."""
    db = get_database()
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db[CONVERSATION_COLLECTION].update_one(
        {"conversation_uid": conversation_uid},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        logger.warning(f"No conversation updated with ID: {conversation_uid}")
        return None
    
    updated_conversation = await get_conversation(conversation_uid)
    logger.info(f"Updated conversation: {updated_conversation['title']}")
    
    return updated_conversation

async def archive_conversation(conversation_uid: str) -> bool:
    """Archive conversation."""
    db = get_database()
    
    result = await db[CONVERSATION_COLLECTION].update_one(
        {"conversation_uid": conversation_uid},
        {"$set": {"is_archived": True, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        logger.warning(f"No conversation archived with ID: {conversation_uid}")
        return False
    
    logger.info(f"Archived conversation with ID: {conversation_uid}")
    return True

async def add_message_to_conversation(
    conversation_uid: str,
    content: str,
    is_user: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Add a new message to a conversation
    If is_user is True, this is a user message and we need to generate a response
    """
    db = get_database()
    
    conversation = await get_conversation(conversation_uid)
    if not conversation:
        logger.error(f"Failed to add message: Conversation {conversation_uid} not found")
        return None
    
    message_uid = str(uuid.uuid4())
    timestamp = datetime.utcnow()
    
    message = {
        "message_uid": message_uid,
        "conversation_uid": conversation_uid,
        "content": content,
        "is_user": is_user,
        "rating": None,
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    await db[MESSAGE_COLLECTION].insert_one(message)
    
    await db[CONVERSATION_COLLECTION].update_one(
        {"conversation_uid": conversation_uid},
        {"$set": {"updated_at": timestamp, "last_message": timestamp}}
    )
    
    # If this is a user message, generate a response
    if is_user:
        agent = await get_agent(conversation["agent_uid"])
        if not agent:
            logger.error(f"Failed to generate response: Agent {conversation['agent_uid']} not found")
            return message
        
        response_content = await generate_text(
            conversation_uid=conversation_uid,
            agent=agent,
            user_message=content
        )
        
        if response_content:
            conversation_dir = os.path.join(CONVERSATION_DIR, conversation_uid)
            os.makedirs(conversation_dir, exist_ok=True)
            
            response_message = await add_message_to_conversation(
                conversation_uid=conversation_uid,
                content=response_content,
                is_user=False
            )
            
            if response_message:
                voice_path = None
                
                if agent.get("custom_voice_path") and os.path.exists(agent["custom_voice_path"]):
                    voice_path = await generate_speech(
                        message_uid=response_message["message_uid"],
                        text=response_content,
                        output_dir=conversation_dir,
                        custom_voice_path=agent["custom_voice_path"]
                    )
                else:
                    voice_path = await generate_speech(
                        message_uid=response_message["message_uid"],
                        text=response_content,
                        output_dir=conversation_dir
                    )
                
                if voice_path:
                    await db[MESSAGE_COLLECTION].update_one(
                        {"message_uid": response_message["message_uid"]},
                        {"$set": {"voice_path": voice_path}}
                    )
                    response_message["voice_path"] = voice_path
                
                return response_message
    
    return message

async def get_message(message_uid: str) -> Optional[Dict[str, Any]]:
    """Get message by ID."""
    db = get_database()
    message = await db[MESSAGE_COLLECTION].find_one({"message_uid": message_uid})
    return message

async def update_message_rating(message_uid: str, rating: MessageRating) -> Optional[Dict[str, Any]]:
    """Update message rating."""
    db = get_database()
    
    result = await db[MESSAGE_COLLECTION].update_one(
        {"message_uid": message_uid},
        {"$set": {"rating": rating}}
    )
    
    if result.modified_count == 0:
        logger.warning(f"No message updated with ID: {message_uid}")
        return None
    
    updated_message = await get_message(message_uid)
    logger.info(f"Updated rating for message: {message_uid} to {rating}")
    
    return updated_message

async def get_conversation_messages(conversation_uid: str) -> List[Dict[str, Any]]:
    """Get all messages in a conversation."""
    db = get_database()
    cursor = db[MESSAGE_COLLECTION].find(
        {"conversation_uid": conversation_uid}
    ).sort("created_at", 1)
    
    messages = await cursor.to_list(length=1000)
    return messages

async def add_message(
    conversation_uid: str,
    content: str,
    message_type: MessageType,
    message_uid: Optional[str] = None,
    voiceline_path: Optional[str] = None,
    agent_uid: Optional[str] = None,
    llm_config_uid: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Add a message to a conversation."""
    db = get_database()
    
    if not message_uid:
        message_uid = str(uuid.uuid4())
    
    timestamp = datetime.utcnow()
    
    message_data = {
        "message_uid": message_uid,
        "conversation_uid": conversation_uid,
        "content": content,
        "message_type": message_type,
        "voiceline_path": voiceline_path,
        "agent_uid": agent_uid,
        "llm_config_uid": llm_config_uid,
        "rating": MessageRating.NONE,
        "created_at": timestamp,
        "updated_at": timestamp,
        "votes": [],
        "metadata": metadata or {}
    }
    
    message_data = {k: v for k, v in message_data.items() if v is not None}
    
    await db[MESSAGE_COLLECTION].insert_one(message_data)
    
    await db[CONVERSATION_COLLECTION].update_one(
        {"conversation_uid": conversation_uid},
        {
            "$set": {"updated_at": timestamp},
            "$inc": {"message_count": 1}
        }
    )
    
    logger.info(f"Added {message_type} message to conversation {conversation_uid}")
    return message_data 