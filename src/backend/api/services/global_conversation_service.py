import uuid
import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

from ..database import get_database
from ..services.agent_service import get_agent
from ..services.llm_service import get_llm_config
from ..models import MessageType, MessageRating

logger = logging.getLogger(__name__)

# Collections
GLOBAL_CONVERSATION_COLLECTION = "global_conversation"
GLOBAL_MESSAGE_COLLECTION = "global_messages"

# Directory structure for data
DATA_DIR = os.path.join(os.getcwd(), "..", "data")
# Change the directory to use conversation/global path
CONVERSATION_DIR = os.path.join(DATA_DIR, "conversation")
GLOBAL_CONVERSATION_DIR = os.path.join(CONVERSATION_DIR, "global")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CONVERSATION_DIR, exist_ok=True)
os.makedirs(GLOBAL_CONVERSATION_DIR, exist_ok=True)

# Global conversation ID - We only have one global conversation
GLOBAL_CONVERSATION_ID = "global"


async def get_or_create_global_conversation() -> Dict[str, Any]:
    """Get or create the global conversation."""
    db = get_database()

    global_conv = await db[GLOBAL_CONVERSATION_COLLECTION].find_one(
        {"conversation_uid": GLOBAL_CONVERSATION_ID}
    )

    if global_conv:
        logger.info("Retrieved existing global conversation")
        return global_conv

    timestamp = datetime.utcnow()

    conversation_dir = os.path.join(GLOBAL_CONVERSATION_DIR, GLOBAL_CONVERSATION_ID)
    os.makedirs(conversation_dir, exist_ok=True)
    logger.info(f"Created global conversation directory: {conversation_dir}")

    global_conv = {
        "conversation_uid": GLOBAL_CONVERSATION_ID,
        "created_at": timestamp,
        "updated_at": timestamp,
        "message_count": 0,
    }

    await db[GLOBAL_CONVERSATION_COLLECTION].insert_one(global_conv)
    logger.info("Created new global conversation in database")

    return global_conv


async def get_global_conversation_with_messages(
    limit: int = 50, skip: int = 0
) -> Dict[str, Any]:
    """Get the global conversation with messages, with pagination."""
    db = get_database()

    global_conv = await get_or_create_global_conversation()

    cursor = (
        db[GLOBAL_MESSAGE_COLLECTION]
        .find({"conversation_uid": GLOBAL_CONVERSATION_ID})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    messages = await cursor.to_list(length=limit)
    messages.reverse()
    global_conv["messages"] = messages

    return global_conv


async def add_message_to_global_conversation(
    content: str,
    message_type: MessageType,
    agent_uid: Optional[str] = None,
    message_uid: Optional[str] = None,
    voiceline_path: Optional[str] = None,
    llm_config_uid: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Add a message to the global conversation."""
    db = get_database()

    global_conv = await get_or_create_global_conversation()

    if not message_uid:
        message_uid = str(uuid.uuid4())

    timestamp = datetime.utcnow()

    conversation_dir = os.path.join(GLOBAL_CONVERSATION_DIR, GLOBAL_CONVERSATION_ID)
    os.makedirs(conversation_dir, exist_ok=True)

    message_data = {
        "message_uid": message_uid,
        "conversation_uid": GLOBAL_CONVERSATION_ID,
        "content": content,
        "message_type": message_type,
        "agent_uid": agent_uid,
        "voiceline_path": voiceline_path,
        "llm_config_uid": llm_config_uid,
        "rating": MessageRating.NONE,
        "created_at": timestamp,
        "updated_at": timestamp,
        "metadata": metadata or {},
    }

    message_data = {k: v for k, v in message_data.items() if v is not None}

    await db[GLOBAL_MESSAGE_COLLECTION].insert_one(message_data)
    logger.info(f"Added {message_type} message to global conversation: {message_uid}")

    # Update the conversation metadata
    await db[GLOBAL_CONVERSATION_COLLECTION].update_one(
        {"conversation_uid": GLOBAL_CONVERSATION_ID},
        {"$set": {"updated_at": timestamp}, "$inc": {"message_count": 1}},
    )

    return message_data


async def get_global_message(message_uid: str) -> Optional[Dict[str, Any]]:
    """Get a message from the global conversation by ID."""
    db = get_database()
    message = await db[GLOBAL_MESSAGE_COLLECTION].find_one({"message_uid": message_uid})
    return message


async def update_global_message_rating(
    message_uid: str, rating: MessageRating
) -> Optional[Dict[str, Any]]:
    """Update the rating of a message in the global conversation."""
    db = get_database()

    result = await db[GLOBAL_MESSAGE_COLLECTION].update_one(
        {"message_uid": message_uid},
        {"$set": {"rating": rating, "updated_at": datetime.utcnow()}},
    )

    if result.modified_count == 0:
        logger.warning(f"No message updated with ID: {message_uid}")
        return None

    updated_message = await get_global_message(message_uid)
    logger.info(f"Updated rating for global message: {message_uid} to {rating}")

    return updated_message
