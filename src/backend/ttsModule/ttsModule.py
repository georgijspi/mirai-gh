import os
import torch
import logging

# Set environment variable for PyTorch 2.6+ 
os.environ["TORCH_LOAD_WEIGHTS_ONLY"] = "0"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to add necessary classes to safe_globals (for PyTorch 2.6+)
try:
    if hasattr(torch.serialization, "add_safe_globals"):
        # Register ALL classes that might be needed for deserialization
        # This is the key to making it work with PyTorch 2.6+
        from TTS.tts.configs.xtts_config import XttsConfig
        from TTS.tts.models.xtts import Xtts, XttsAudioConfig, XttsArgs
        from TTS.config.shared_configs import BaseDatasetConfig
        from TTS.tts.models.base_tts import BaseTTS
        from TTS.encoder.configs.base_encoder_config import BaseEncoderConfig
        from TTS.utils.generic_utils import get_user_data_dir
        
        # Add ALL relevant classes to safe_globals
        classes = [
            XttsConfig, Xtts, XttsAudioConfig, BaseDatasetConfig, 
            BaseTTS, BaseEncoderConfig, XttsArgs
        ]
        torch.serialization.add_safe_globals(classes)
        logger.info("Successfully added TTS model classes to PyTorch safe_globals")
except Exception as e:
    logger.warning(f"Error adding classes to PyTorch safe_globals: {e}")

# Initialize device for TTS
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")

# Only import TTS after setting up the environment and safe_globals
try:
    from TTS.api import TTS
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    logger.info(f"TTS Model successfully loaded onto {device}")
except Exception as e:
    logger.error(f"Failed to load TTS model: {e}")
    tts = None
    
def generate_speech(speaker_wav_path: str, text: str, output_path: str):
    """
    Text to speech generation using Coqui XTTS.

    speaker_wav_path: Path to the sample audio file for voice cloning.
    text: The text to synthesize.
    output_path: Path to save the generated .wav file.
    """
    if tts is None:
        raise RuntimeError("TTS model is not loaded")

    if not os.path.exists(speaker_wav_path):
        raise FileNotFoundError(f"Speaker WAV file not found at {speaker_wav_path}")

    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Generate the speech
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav_path,
            language="en",
            file_path=output_path
        )
        logger.info(f"Speech successfully generated at: {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        raise