from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services import settings_service

router = APIRouter(prefix="/settings", tags=["settings"])

class AccessKeyModel(BaseModel):
    """Model for Picovoice access key."""
    access_key: str

@router.get("/picovoice-access-key", response_model=Optional[str])
async def get_picovoice_access_key():
    """Get the Picovoice access key."""
    try:
        key = await settings_service.get_picovoice_access_key()
        return key
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve Picovoice access key: {str(e)}")

@router.post("/picovoice-access-key")
async def set_picovoice_access_key(data: AccessKeyModel):
    """Set the Picovoice access key."""
    try:
        result = await settings_service.set_picovoice_access_key(data.access_key)
        return {"message": "Picovoice access key updated successfully", "key": result["key"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update Picovoice access key: {str(e)}") 