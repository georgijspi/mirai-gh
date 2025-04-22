from fastapi import (
    APIRouter,
    HTTPException,
    BackgroundTasks,
    Depends,
    Query,
    File,
    UploadFile,
)
from fastapi.responses import FileResponse, JSONResponse
import os
import time
import uuid
import logging
from typing import List, Optional

# Set environment variables before importing TTS module
os.environ["TORCH_LOAD_WEIGHTS_ONLY"] = "0"

from .. import models
from ..security import get_current_user, DEV_MODE
from ttsModule.ttsModule import generate_speech, tts
from ..services.tts_service import generate_voice, get_available_voices, get_voice_path

logger = logging.getLogger(__name__)

APP_ROOT_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
INPUT_DIR = os.path.join(APP_ROOT_DIR, "ttsModule", "voicelines", "cleaned")
OUTPUT_DIR = os.path.join(APP_ROOT_DIR, "ttsModule", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def check_tts_model_loaded():
    """Check if the TTS model is loaded."""
    from ttsModule.ttsModule import tts

    if tts is None:
        error_msg = "TTS Service Unavailable: Model failed to load. Check server logs for details."
        logger.error("API request failed: TTS model not loaded")
        raise HTTPException(status_code=503, detail=error_msg)


# --- Router Definition ---
router = APIRouter(
    prefix="/tts", tags=["TTS"], dependencies=[Depends(check_tts_model_loaded)]
)


def get_speaker_path(speaker_name: str) -> str:
    """Gets the full path for a speaker's cleaned WAV file."""
    if not speaker_name or ".." in speaker_name or "/" in speaker_name:
        raise HTTPException(status_code=400, detail="Invalid speaker name provided.")

    speaker_files = {
        "morgan": "morgan_cleaned.wav",
        "jarvis": "jarvis_cleaned.wav",
    }

    filename = speaker_files.get(speaker_name.lower())
    if not filename:
        raise HTTPException(
            status_code=404, detail=f"Speaker '{speaker_name}' not found."
        )

    path = os.path.join(INPUT_DIR, filename)
    if not os.path.exists(path):
        logger.error(f"Speaker file configured but not found: {path}")
        raise HTTPException(
            status_code=500, detail=f"Speaker '{speaker_name}' voice file missing."
        )
    return path


# --- API Endpoints ---


@router.post("/generate", response_model=models.TTSResponse)
async def generate_tts(tts_request: models.TTSRequest, user=Depends(get_current_user)):
    """Generate a voice line from text."""
    try:
        # Get the output wav path
        output_path = await generate_voice(
            text=tts_request.text,
            voice_speaker=tts_request.speaker,
            message_uid=tts_request.message_uid,
            conversation_uid=tts_request.conversation_uid,
        )

        return models.TTSResponse(
            message="Speech generation started in background", file_path=output_path
        )
    except Exception as e:
        logger.error(f"Failed to generate speech: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate speech: {str(e)}"
        )


@router.get("/download/{message_uid}")
async def download_tts(
    message_uid: str,
    conversation_uid: Optional[str] = None,
    user=Depends(get_current_user),
):
    """Download a generated voice line."""
    try:
        # Get the voice file path
        voice_path = await get_voice_path(message_uid, conversation_uid)

        if not voice_path:
            raise HTTPException(
                status_code=404,
                detail=f"Voice file for message {message_uid} not found",
            )

        # Get the absolute path
        abs_path = os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ),
            "..",
            voice_path,
        )

        # Check if the file exists
        if not os.path.exists(abs_path):
            raise HTTPException(
                status_code=404, detail=f"Voice file not found at path: {abs_path}"
            )

        # Return the file
        return FileResponse(
            abs_path, media_type="audio/wav", filename=f"message_{message_uid}.wav"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download voice file: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to download voice file: {str(e)}"
        )


@router.get("/voices", response_model=List[models.Voice])
async def list_voices(user=Depends(get_current_user)):
    """Get a list of available voices."""
    try:
        voices = await get_available_voices()
        return voices
    except Exception as e:
        logger.error(f"Failed to get available voices: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get available voices: {str(e)}"
        )


@router.get("/stream/{message_uid}")
async def stream_tts(
    message_uid: str,
    conversation_uid: Optional[str] = None,
    user=Depends(get_current_user) if not DEV_MODE else None,
):
    """Stream a generated voice line as audio content."""
    try:
        # Get the voice file path
        voice_path = await get_voice_path(message_uid, conversation_uid)

        if not voice_path:
            raise HTTPException(
                status_code=404,
                detail=f"Voice file for message {message_uid} not found",
            )

        # Get the absolute path
        abs_path = os.path.join(
            os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ),
            "..",
            voice_path,
        )

        # Check if the file exists
        if not os.path.exists(abs_path):
            raise HTTPException(
                status_code=404, detail=f"Voice file not found at path: {abs_path}"
            )

        # Return the file with headers for streaming audio
        return FileResponse(
            abs_path,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"inline; filename=message_{message_uid}.wav",
                "Accept-Ranges": "bytes",
                "Cache-Control": "no-cache",
                "X-Message-UID": message_uid,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stream voice file: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to stream voice file: {str(e)}"
        )
