from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import logging
import os
import shutil
import uuid
from typing import List, Optional

from ..models import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    AgentListResponse,
    StatusResponse
)
from ..security import get_current_user
from ..services.agent_service import (
    create_agent,
    get_agent,
    get_all_agents,
    update_agent,
    archive_agent
)
from ..services.tts_service import use_custom_voice

logger = logging.getLogger(__name__)

# File storage paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "data")
AGENT_DIR = os.path.join(DATA_DIR, "agent")
CLEANED_VOICE_DIR = os.path.join("ttsModule", "voicelines", "cleaned")

# Ensure directories exist
os.makedirs(AGENT_DIR, exist_ok=True)
os.makedirs(CLEANED_VOICE_DIR, exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_AUDIO_TYPES = ["audio/wav", "audio/x-wav"]

router = APIRouter(prefix="/agent", tags=["Agent"])

@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def add_agent(
    agent_data: AgentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new agent."""
    try:
        agent = await create_agent(
            name=agent_data.name,
            personality_prompt=agent_data.personality_prompt,
            voice_speaker=agent_data.voice_speaker,
            llm_config_uid=agent_data.llm_config_uid,
            profile_picture_path=agent_data.profile_picture_path,
            custom_voice_path=agent_data.custom_voice_path
        )
        logger.info(f"Agent created: {agent_data.name}")
        return agent
    except ValueError as e:
        logger.error(f"Error creating agent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating agent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent: {str(e)}"
        )

@router.post("/{agent_uid}/profile-picture")
async def upload_profile_picture(
    agent_uid: str,
    file: UploadFile = File(...)
):
    """Upload a profile picture for an agent"""
    try:
        agent = await get_agent(agent_uid)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        agent_dir = os.path.join(AGENT_DIR, agent_uid)
        os.makedirs(agent_dir, exist_ok=True)
        
        file_ext = os.path.splitext(file.filename)[1]
        profile_filename = f"profile_{uuid.uuid4()}{file_ext}"
        
        file_path = os.path.join(agent_dir, profile_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        relative_path = os.path.join("..", "data", "agent", agent_uid, profile_filename)
        update_data = AgentUpdate(profile_picture_path=relative_path)
        updated_agent = await update_agent(agent_uid, update_data)
        
        return {"profile_picture_path": relative_path}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload profile picture: {str(e)}")

@router.post("/{agent_uid}/custom-voice")
async def upload_custom_voice(
    agent_uid: str,
    file: UploadFile = File(...)
):
    """Upload a custom voice file for an agent"""
    try:
        agent = await get_agent(agent_uid)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Check file type using both content type and file extension
        valid_file = False
        
        # Define acceptable WAV content types
        acceptable_wav_types = ["audio/wav", "audio/x-wav", "audio/vnd.wave", "audio/wave"]
        
        if file.content_type and file.content_type in acceptable_wav_types:
            valid_file = True
            logger.info(f"Valid content type detected: {file.content_type}")
            
        if file.filename and file.filename.lower().endswith('.wav'):
            valid_file = True
            logger.info(f"Valid file extension detected: {file.filename}")
            
        if not valid_file:
            logger.error(f"Invalid file format: {file.filename}, content_type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be a WAV audio file")
        
        temp_file = os.path.join(os.getcwd(), f"temp_{uuid.uuid4()}.wav")
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(temp_file)
        logger.info(f"Temporary file created: {temp_file}, size: {file_size} bytes")
        
        voice_path = await use_custom_voice(agent_uid, temp_file)
        
        os.remove(temp_file)
        
        if not voice_path:
            raise HTTPException(status_code=500, detail="Failed to process voice file")
        
        update_data = AgentUpdate(custom_voice_path=voice_path)
        updated_agent = await update_agent(agent_uid, update_data)
        
        logger.info(f"Custom voice successfully uploaded for agent {agent_uid}: {voice_path}")
        return {"custom_voice_path": voice_path}
    
    except Exception as e:
        logger.error(f"Failed to upload custom voice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload custom voice: {str(e)}")

@router.get("/list", response_model=AgentListResponse)
async def list_agents(
    include_archived: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """List all agents."""
    agents = await get_all_agents(include_archived)
    return {"agents": agents}

@router.get("/{agent_uid}", response_model=AgentResponse)
async def get_agent_by_id(
    agent_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """Get an agent by ID."""
    agent = await get_agent(agent_uid)
    if not agent:
        logger.warning(f"Agent not found: {agent_uid}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    return agent

@router.put("/{agent_uid}", response_model=AgentResponse)
async def update_agent_by_id(
    agent_uid: str,
    agent_data: AgentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an agent."""
    try:
        # Filter out None values
        update_data = {k: v for k, v in agent_data.dict().items() if v is not None}
        updated_agent = await update_agent(agent_uid, update_data)
        
        if not updated_agent:
            logger.warning(f"Agent not found for update: {agent_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
        
        logger.info(f"Agent updated: {updated_agent['name']}")
        return updated_agent
    except ValueError as e:
        logger.error(f"Error updating agent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating agent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update agent: {str(e)}"
        )

@router.delete("/{agent_uid}", response_model=StatusResponse)
async def archive_agent_by_id(
    agent_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """Archive an agent."""
    try:
        success = await archive_agent(agent_uid)
        
        if not success:
            logger.warning(f"Agent not found for archive: {agent_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
        
        logger.info(f"Agent archived: {agent_uid}")
        return {"status": "success", "message": "Agent archived successfully"}
    except Exception as e:
        logger.error(f"Error archiving agent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive agent: {str(e)}"
        ) 