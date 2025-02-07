# app/tts_module.py
import torch
from TTS.api import TTS
import os

# --- Model Loading (Do this ONCE at module level) ---
device = "cuda" if torch.cuda.is_available() else "cpu"
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
print(f"TTS Model loaded onto {device}")

def generate_speech(speaker_wav_path: str, text: str, output_path: str):
    """
    Test to speech generation using Coqui XTTS.

    speaker_wav_path: Path to the sample audio file.
    text: The text to synthesize.
    output_path: Path to save the generated .wav file.
    """
    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_wav_path,
        language="en",
        file_path=output_path
    )
    print(f"Speech generated at: {output_path}")

    return output_path