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
    
    if agent and agent.get('profile_picture_path'):
        agent['profile_picture_url'] = f"/agent/{agent_uid}/profile-picture"
    
    return agent

async def get_all_agents() -> List[Dict[str, Any]]:
    """Get all agent configurations."""
    db = get_database()
    agents = await db[AGENT_COLLECTION].find({}).to_list(length=100)
    
    # Add profile picture URLs for each agent without /mirai/api prefix
    for agent in agents:
        if agent.get('profile_picture_path'):
            agent['profile_picture_url'] = f"/agent/{agent['agent_uid']}/profile-picture"
    
    return agents

async def update_agent(uid: str, update_data: Union[AgentUpdate, Dict[str, Any]]) -> Agent:
    """Update an existing agent"""
    logger.info(f"Updating agent with UID: {uid}")
    
    if isinstance(update_data, dict):
        update_data = AgentUpdate(**update_data)
    
    update_dict = update_data.dict(exclude_unset=True)
    
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

async def delete_agent(agent_uid: str) -> bool:
    """Permanently delete an agent."""
    db = get_database()
    
    agent = await get_agent(agent_uid)
    if not agent:
        logger.warning(f"No agent found with ID: {agent_uid}")
        return False
    
    # Delete any associated files (profile pictures, voice files)
    agent_dir = os.path.join(AGENT_DIR, agent_uid)
    if os.path.exists(agent_dir):
        try:
            shutil.rmtree(agent_dir)
            logger.info(f"Deleted agent directory: {agent_dir}")
        except Exception as e:
            logger.warning(f"Failed to delete agent directory: {str(e)}")
    
    result = await db[AGENT_COLLECTION].delete_one({"agent_uid": agent_uid})
    
    if result.deleted_count == 0:
        logger.warning(f"No agent deleted with ID: {agent_uid}")
        return False
    
    logger.info(f"Deleted agent with ID: {agent_uid}")
    return True 