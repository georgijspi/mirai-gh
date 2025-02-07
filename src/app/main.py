# app/main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydub import AudioSegment
from pydub.playback import play
import os
import time
import uuid
from ttsModule.ttsModule import generate_speech
from pydantic import BaseModel

app = FastAPI()

# Define a Pydantic model for the request body
class SynthesisRequest(BaseModel):
    text: str

# Configuration
INPUT_DIR = "ttsModule/voicelines/cleaned"
OUTPUT_DIR = "ttsModule/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/synthesize/")
async def synthesize_speech(request: SynthesisRequest, background_tasks: BackgroundTasks): # Use the model
    """
    Synthesizes speech from text.
    """
    start_time = time.time()

    # File Paths
    speaker_wav_path = os.path.join(INPUT_DIR, "morgan_cleaned.wav")
    if not os.path.exists(speaker_wav_path):
        raise HTTPException(status_code=500, detail="Speaker WAV file not found")

    unique_id = str(uuid.uuid4())
    output_filename = f"output_{unique_id}.wav"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    # Generate Speech
    # Access the text from the request object
    background_tasks.add_task(generate_speech, speaker_wav_path, request.text, output_path)

    return {
        "message": "Speech generation started",
        "output_filename": output_filename,
        "generation_started_at": start_time
    }
 
@app.get("/download/{filename}")
async def download_speech(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/wav", filename=filename)

@app.get("/play/{filename}")
async def play_speech(filename: str):
    """
    Allows play a previously generated speech file.
    """
    file_path = os.path.join(OUTPUT_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        audio = AudioSegment.from_wav(file_path)
        play(audio)
        return {"message": "Audio playback started."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during playback: {e}")

@app.post("/synthesize_and_play/")
async def synthesize_and_play_speech(request: SynthesisRequest):
    """
    Synthesizes speech from text and plays it immediately.
    """
    start_time = time.time()

    # File Paths
    speaker_wav_path = os.path.join(INPUT_DIR, "jarvis_cleaned.wav")
    if not os.path.exists(speaker_wav_path):
        raise HTTPException(status_code=500, detail="Speaker WAV file not found")

    unique_id = str(uuid.uuid4())
    output_filename = f"output_{unique_id}.wav"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    # Generate Speech (synchronous, not in background)
    try:
        generate_speech(speaker_wav_path, request.text, output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {e}")

    # Play the generated audio
    try:
        audio = AudioSegment.from_wav(output_path)
        play(audio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio playback failed: {e}")

    end_time = time.time()
    elapsed_time = end_time - start_time

    # Return a Response
    return {
        "message": "Speech generated and played",
        "processing_time": elapsed_time,
        "output_filename": output_filename
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)