import uuid
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import os
import shutil
from uuid import UUID, uuid4
from pydantic import BaseModel

from api.database import get_database
from api.services.llm_service import get_llm_config
from ..models import AgentCreate, Agent, AgentUpdate

logger = logging.getLogger(__name__)

# Collections
AGENT_COLLECTION = "agents"

# Make sure we create the directories if they don't exist
DATA_DIR = os.path.join(os.getcwd(), "..", "data")
AGENT_DIR = os.path.join(DATA_DIR, "agent")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(AGENT_DIR, exist_ok=True)

async def create_agent(
    name: str,
    personality_prompt: str,
    voice_speaker: str,
    llm_config_uid: str,
    profile_picture_path: Optional[str] = None,
    custom_voice_path: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new agent."""
    db = get_database()
    
    # Validate LLM config
    llm_config = await get_llm_config(llm_config_uid)
    if not llm_config:
        logger.error(f"Failed to create agent: LLM config {llm_config_uid} not found")
        raise ValueError(f"LLM config with ID {llm_config_uid} not found")
    
    # Create agent
    agent_uid = str(uuid.uuid4())
    timestamp = datetime.utcnow()
    
    agent_data = {
        "agent_uid": agent_uid,
        "name": name,
        "personality_prompt": personality_prompt,
        "voice_speaker": voice_speaker,
        "llm_config_uid": llm_config_uid,
        "profile_picture_path": profile_picture_path,
        "custom_voice_path": custom_voice_path,
        "is_archived": False,
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    await db[AGENT_COLLECTION].insert_one(agent_data)
    logger.info(f"Created new agent: {name}")
    
    return agent_data

async def get_agent(agent_uid: str) -> Optional[Dict[str, Any]]:
    """Get agent configuration by ID."""
    db = get_database()
    agent = await db[AGENT_COLLECTION].find_one({"agent_uid": agent_uid})
    return agent

async def get_all_agents(include_archived: bool = False) -> List[Dict[str, Any]]:
    """Get all agent configurations."""
    db = get_database()
    query = {} if include_archived else {"is_archived": False}
    cursor = db[AGENT_COLLECTION].find(query)
    agents = await cursor.to_list(length=100)
    return agents

async def update_agent(uid: str, update_data: Union[AgentUpdate, Dict[str, Any]]) -> Agent:
    """Update an existing agent"""
    logger.info(f"Updating agent with UID: {uid}")
    
    if isinstance(update_data, dict):
        # Convert dict to AgentUpdate
        update_data = AgentUpdate(**update_data)
    
    # Convert to dict and remove None values
    update_dict = update_data.dict(exclude_unset=True)
    
    # Add last updated timestamp
    update_dict["updated_at"] = datetime.utcnow()
    
    # If there's nothing to update, just return the existing agent
    if not update_dict:
        return await get_agent(uid)
    
    result = await get_database()[AGENT_COLLECTION].update_one(
        {"agent_uid": uid},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        logger.warning(f"No agent found with UID: {uid}")
        return None
    
    return await get_agent(uid)

async def archive_agent(agent_uid: str) -> bool:
    """Archive agent configuration."""
    db = get_database()
    
    result = await db[AGENT_COLLECTION].update_one(
        {"agent_uid": agent_uid},
        {"$set": {"is_archived": True, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        logger.warning(f"No agent archived with ID: {agent_uid}")
        return False
    
    logger.info(f"Archived agent with ID: {agent_uid}")
    return True 