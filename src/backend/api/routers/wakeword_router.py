from fastapi import APIRouter, UploadFile, Depends, HTTPException
from ..services.file_storage_service import FileStorageService

router = APIRouter(prefix="/wakeword", tags=["wakeword"])

@router.post("/upload-model")
async def upload_model(
    file: UploadFile,
    file_service: FileStorageService = Depends(FileStorageService)
) -> dict:
    """Upload a wakeword model file."""
    try:
        file_path = await file_service.store_wakeword_model(file)
        return {"status": "success", "file_path": file_path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 