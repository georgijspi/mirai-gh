from fastapi import APIRouter, Depends, HTTPException, status
import logging
from typing import List, Dict, Any

from ..models import (
    LlmConfigCreate, 
    LlmConfigUpdate, 
    LlmConfigResponse, 
    LlmModelListResponse, 
    StatusResponse
)
from ..security import get_current_user
from ..services.llm_service import (
    create_llm_config,
    get_llm_config,
    get_all_llm_configs,
    update_llm_config,
    archive_llm_config,
    list_ollama_models,
    pull_ollama_model,
    delete_ollama_model
)

logger = logging.getLogger(__name__)

# LLM Router for config and operations 
router = APIRouter(prefix="/llm", tags=["LLM"])

# --- Configuration Endpoints ---

@router.post("/config", response_model=LlmConfigResponse, status_code=status.HTTP_201_CREATED)
async def add_llm_config(
    config_data: LlmConfigCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new LLM configuration."""
    try:
        config = await create_llm_config(
            name=config_data.name,
            model=config_data.model,
            temperature=config_data.temperature,
            top_p=config_data.top_p,
            top_k=config_data.top_k,
            repeat_penalty=config_data.repeat_penalty,
            max_tokens=config_data.max_tokens,
            presence_penalty=config_data.presence_penalty,
            frequency_penalty=config_data.frequency_penalty,
            stop_sequences=config_data.stop_sequences,
            additional_params=config_data.additional_params,
            tts_instructions=config_data.tts_instructions,
        )
        logger.info(f"LLM config created: {config_data.name}")
        return config
    except Exception as e:
        logger.error(f"Error creating LLM config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create LLM configuration: {str(e)}"
        )

@router.get("/config/{config_uid}", response_model=LlmConfigResponse)
async def get_config(
    config_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """Get an LLM configuration by ID."""
    config = await get_llm_config(config_uid)
    if not config:
        logger.warning(f"LLM config not found: {config_uid}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LLM configuration not found"
        )
    return config

@router.get("/config", response_model=List[LlmConfigResponse])
async def list_configs(
    include_archived: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """List all LLM configurations."""
    configs = await get_all_llm_configs(include_archived)
    return configs

@router.put("/config/{config_uid}", response_model=LlmConfigResponse)
async def update_config(
    config_uid: str,
    config_data: LlmConfigUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an LLM configuration."""
    try:
        # Filter out None values
        update_data = {k: v for k, v in config_data.dict().items() if v is not None}
        config = await update_llm_config(config_uid, update_data)
        
        if not config:
            logger.warning(f"LLM config not found for update: {config_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LLM configuration not found"
            )
        
        logger.info(f"LLM config updated: {config['name']}")
        return config
    except Exception as e:
        logger.error(f"Error updating LLM config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update LLM configuration: {str(e)}"
        )

@router.delete("/config/{config_uid}", response_model=StatusResponse)
async def archive_config(
    config_uid: str,
    current_user: dict = Depends(get_current_user)
):
    """Archive an LLM configuration."""
    try:
        success = await archive_llm_config(config_uid)
        
        if not success:
            logger.warning(f"LLM config not found for archive: {config_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LLM configuration not found"
            )
        
        logger.info(f"LLM config archived: {config_uid}")
        return {"status": "success", "message": "LLM configuration archived successfully"}
    except Exception as e:
        logger.error(f"Error archiving LLM config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive LLM configuration: {str(e)}"
        )

# --- Ollama Endpoints ---

@router.get("/ollama/list", response_model=LlmModelListResponse)
async def list_models(
    current_user: dict = Depends(get_current_user)
):
    """List available models from Ollama."""
    try:
        models = await list_ollama_models()
        return {"models": models}
    except Exception as e:
        logger.error(f"Error listing Ollama models: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list models: {str(e)}"
        )

@router.post("/ollama/pull", response_model=StatusResponse)
async def pull_model(
    model_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Pull a model from Ollama."""
    try:
        result = await pull_ollama_model(model_name)
        logger.info(f"Model pulled: {model_name}")
        return result
    except ValueError as e:
        logger.error(f"Error pulling Ollama model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error pulling Ollama model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pull model: {str(e)}"
        )

@router.delete("/ollama/delete", response_model=StatusResponse)
async def delete_model(
    model_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a model from Ollama."""
    try:
        result = await delete_ollama_model(model_name)
        logger.info(f"Model deleted: {model_name}")
        return result
    except ValueError as e:
        logger.error(f"Error deleting Ollama model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting Ollama model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete model: {str(e)}"
        )
