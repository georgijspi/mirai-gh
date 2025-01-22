import torch
from TTS.api import TTS
from pathlib import Path

def generate_speech(tts, speaker_wav_path, text, output_path):
    """
    Generates speech using Coqui XTTS.

    Args:
        tts: Loaded TTS model object.
        speaker_wav_path: Path to the sample audio file for voice cloning.
        text: The text to be synthesized.
        output_path: Path to save the generated audio file.
    """

    # Generate speech
    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_wav_path,
        language="en",  # Assuming English; change if necessary
        file_path=output_path
    )

    print(f"Speech generated at: {output_path}")