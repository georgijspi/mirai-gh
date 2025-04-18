import uuid
import logging
import httpx
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from api.database import get_database

logger = logging.getLogger(__name__)

# Collections
LLM_CONFIG_COLLECTION = "llm_configurations"

# Ollama API
OLLAMA_API_BASE = "http://localhost:11434/api"

async def create_llm_config(
    name: str,
    model: str,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 40,
    repeat_penalty: float = 1.1,
    max_tokens: int = 4096,
    presence_penalty: float = 0.0,
    frequency_penalty: float = 0.0,
    stop_sequences: List[str] = [],
    additional_params: Dict[str, Any] = {},
    tts_instructions: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new LLM configuration."""
    db = get_database()
    
    config_uid = str(uuid.uuid4())
    timestamp = datetime.utcnow()
    
    # If tts_instructions is not provided, use the default from LlmConfigBase
    if tts_instructions is None:
        from api.models import LlmConfigBase
        tts_instructions = LlmConfigBase.__fields__["tts_instructions"].default
    
    config_data = {
        "config_uid": config_uid,
        "name": name,
        "model": model,
        "temperature": temperature,
        "top_p": top_p,
        "top_k": top_k,
        "repeat_penalty": repeat_penalty,
        "max_tokens": max_tokens,
        "presence_penalty": presence_penalty,
        "frequency_penalty": frequency_penalty,
        "stop_sequences": stop_sequences,
        "additional_params": additional_params,
        "tts_instructions": tts_instructions,
        "is_archived": False,
        "created_at": timestamp,
        "updated_at": timestamp
    }
    
    await db[LLM_CONFIG_COLLECTION].insert_one(config_data)
    logger.info(f"Created new LLM configuration: {name} for model {model}")
    
    return config_data

async def get_llm_config(config_uid: str) -> Optional[Dict[str, Any]]:
    """Get LLM configuration by ID."""
    db = get_database()
    config = await db[LLM_CONFIG_COLLECTION].find_one({"config_uid": config_uid})
    return config

async def get_all_llm_configs(include_archived: bool = False) -> List[Dict[str, Any]]:
    """Get all LLM configurations."""
    db = get_database()
    query = {} if include_archived else {"is_archived": False}
    cursor = db[LLM_CONFIG_COLLECTION].find(query)
    configs = await cursor.to_list(length=100)
    return configs

async def update_llm_config(config_uid: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update LLM configuration."""
    db = get_database()
    
    # Add updated timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    # Perform update
    result = await db[LLM_CONFIG_COLLECTION].update_one(
        {"config_uid": config_uid},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        logger.warning(f"No LLM configuration updated with ID: {config_uid}")
        return None
    
    # Get updated config
    updated_config = await get_llm_config(config_uid)
    logger.info(f"Updated LLM configuration: {updated_config['name']}")
    
    return updated_config

async def archive_llm_config(config_uid: str) -> bool:
    """Archive LLM configuration."""
    db = get_database()
    
    result = await db[LLM_CONFIG_COLLECTION].update_one(
        {"config_uid": config_uid},
        {"$set": {"is_archived": True, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        logger.warning(f"No LLM configuration archived with ID: {config_uid}")
        return False
    
    logger.info(f"Archived LLM configuration with ID: {config_uid}")
    return True

# Ollama API functions

async def list_ollama_models() -> List[Dict[str, Any]]:
    """List available models from Ollama."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_API_BASE}/tags")
            response.raise_for_status()
            data = response.json()
            return data.get("models", [])
    except httpx.HTTPError as e:
        logger.error(f"Error fetching models from Ollama: {e}")
        raise

async def pull_ollama_model(model_name: str) -> Dict[str, Any]:
    """Pull a model from Ollama."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_API_BASE}/pull",
                json={"name": model_name}
            )
            response.raise_for_status()
            return {"status": "success", "message": f"Model {model_name} pulled successfully"}
    except httpx.HTTPError as e:
        logger.error(f"Error pulling model {model_name} from Ollama: {e}")
        error_msg = f"Failed to pull model: {str(e)}"
        if e.response and e.response.text:
            try:
                error_data = json.loads(e.response.text)
                if "error" in error_data:
                    error_msg = error_data["error"]
            except:
                pass
        raise ValueError(error_msg)

async def delete_ollama_model(model_name: str) -> Dict[str, Any]:
    """Delete a model from Ollama."""
    try:
        data = json.dumps({"model": model_name})
        headers = {"Content-Type": "application/json"}
        
        async with httpx.AsyncClient() as client:
            response = await client.request(
                "DELETE",
                f"{OLLAMA_API_BASE}/delete",
                content=data,
                headers=headers
            )
            response.raise_for_status()
            return {"status": "success", "message": f"Model {model_name} deleted successfully"}
    except httpx.HTTPError as e:
        logger.error(f"Error deleting model {model_name} from Ollama: {e}")
        error_msg = f"Failed to delete model: {str(e)}"
        if e.response and e.response.text:
            try:
                error_data = json.loads(e.response.text)
                if "error" in error_data:
                    error_msg = error_data["error"]
            except:
                pass
        raise ValueError(error_msg)

async def generate_text(
    model: str,
    prompt: str,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 40,
    repeat_penalty: float = 1.1,
    max_tokens: int = 2048,
    presence_penalty: float = 0.0,
    frequency_penalty: float = 0.0,
    stop: List[str] = [],
    **kwargs
) -> str:
    """Generate text using Ollama."""
    try:
        params = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "repeat_penalty": repeat_penalty,
                "num_predict": max_tokens,
                "presence_penalty": presence_penalty,
                "frequency_penalty": frequency_penalty,
                "stop": stop
            }
        }
        
        # Add any additional parameters
        for key, value in kwargs.items():
            if key not in params["options"]:
                params["options"][key] = value
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_API_BASE}/generate",
                json=params,
                timeout=90.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
    except httpx.HTTPError as e:
        logger.error(f"Error generating text with model {model}: {e}")
        error_msg = f"Failed to generate text: {str(e)}"
        if e.response and e.response.text:
            try:
                error_data = json.loads(e.response.text)
                if "error" in error_data:
                    error_msg = error_data["error"]
            except:
                pass
        raise ValueError(error_msg) 