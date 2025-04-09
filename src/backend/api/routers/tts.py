from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
import os
import time
import uuid
import logging

# Set environment variables before importing TTS module
os.environ["TORCH_LOAD_WEIGHTS_ONLY"] = "0"

from .. import models
from ..security import get_current_user
from ttsModule.ttsModule import generate_speech, tts

logger = logging.getLogger(__name__)

APP_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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
    prefix="/tts",
    tags=["TTS"],
    dependencies=[Depends(check_tts_model_loaded)]
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
         raise HTTPException(status_code=404, detail=f"Speaker '{speaker_name}' not found.")

    path = os.path.join(INPUT_DIR, filename)
    if not os.path.exists(path):
        logger.error(f"Speaker file configured but not found: {path}")
        raise HTTPException(status_code=500, detail=f"Speaker '{speaker_name}' voice file missing.")
    return path

# --- API Endpoints ---

@router.post("/generate", response_model=models.SynthesisResponse)
async def generate_speech_endpoint(
    request: models.SynthesisRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    tts_ready: None = Depends(check_tts_model_loaded)
):
    """
    Starts background task to synthesize speech from text using a specified speaker.
    Defaults to 'morgan' if no speaker is provided.
    """
    try:
        speaker_wav_path = get_speaker_path(request.speaker or "morgan")
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error resolving speaker path: {e}")
        raise HTTPException(status_code=500, detail="Internal server error resolving speaker.")

    unique_id = str(uuid.uuid4())
    output_filename = f"output_{unique_id}.wav"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    try:
        # Add the generation task to the background
        background_tasks.add_task(generate_speech, speaker_wav_path, request.text, output_path)
        logger.info(f"Background TTS task added for {output_filename}")
    except Exception as e:
        logger.error(f"Failed to add background task: {e}")
        raise HTTPException(status_code=500, detail="Failed to start speech generation task.")

    return {
        "message": "Speech generation started in background",
        "output_filename": output_filename,
    }

@router.post("/download", response_class=FileResponse)
async def download_speech_endpoint(
    request: models.FileRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Downloads a previously generated speech file.
    Requires 'filename' in the POST request body.
    """
    # Basic filename validation
    if not request.filename or ".." in request.filename or "/" in request.filename:
        raise HTTPException(status_code=400, detail="Invalid filename provided.")

    file_path = os.path.join(OUTPUT_DIR, request.filename)

    if not os.path.exists(file_path):
        logger.warning(f"Download request for non-existent file: {request.filename}")
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, media_type="audio/wav", filename=request.filename)