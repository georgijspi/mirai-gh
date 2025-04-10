import logging
import os
import re
import time
import torch
import uuid
import shutil
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
from pydub import AudioSegment

from ..models import Voice
from ttsModule.ttsModule import generate_speech as tts_generate_speech, tts

logger = logging.getLogger(__name__)

# Directory structure
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "data")
CONVERSATION_DIR = os.path.join(DATA_DIR, "conversation")
AGENT_DIR = os.path.join(DATA_DIR, "agent")

# Default voice samples directory (in the repo for initial setup)
DEFAULT_VOICE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ttsModule", "voicelines", "cleaned")

# Ensure directories exist
os.makedirs(CONVERSATION_DIR, exist_ok=True)
os.makedirs(AGENT_DIR, exist_ok=True)
os.makedirs(DEFAULT_VOICE_DIR, exist_ok=True)

def clean_text(text: str) -> str:
    """Clean text for TTS processing."""
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def get_audio_duration(file_path: str) -> float:
    """Get the duration of an audio file in seconds using pydub."""
    try:
        audio = AudioSegment.from_wav(file_path)
        duration = len(audio) / 1000.0  # Convert milliseconds to seconds
        return duration
    except Exception as e:
        logger.error(f"Error getting audio duration: {str(e)}")
        return 0.0

async def generate_speech(
    message_uid: str,
    text: str,
    output_dir: Optional[str] = None,
    custom_voice_path: Optional[str] = None
) -> Optional[str]:
    """
    Generate speech from text and save it to a file.
    
    Args:
        message_uid: The unique identifier for the message
        text: The text to convert to speech
        output_dir: The directory to save the audio file (defaults to conversation directory)
        custom_voice_path: Optional path to a custom voice file
        
    Returns:
        Path to the generated audio file or None if generation failed
    """
    if not text:
        logger.warning("Cannot generate speech for empty text")
        return None
    
    try:
        cleaned_text = clean_text(text)
        
        if not output_dir:
            output_dir = CONVERSATION_DIR
        os.makedirs(output_dir, exist_ok=True)
        
        filename = f"message_{message_uid}.wav"
        output_path = os.path.join(output_dir, filename)
        
        # Default to morgan voice sample
        speaker_wav_path = os.path.join(DEFAULT_VOICE_DIR, "morgan_cleaned.wav")
        
        if custom_voice_path and os.path.exists(custom_voice_path):
            speaker_wav_path = custom_voice_path
            logger.info(f"Using custom voice: {custom_voice_path}")
        
        tts_generate_speech(speaker_wav_path, cleaned_text, output_path)
        
        if os.path.exists(output_path):
            logger.info(f"Generated voice file: {output_path}")
            return output_path
        else:
            logger.error(f"Failed to generate voice file: {output_path}")
            return None
            
    except Exception as e:
        logger.error(f"Error generating speech: {str(e)}")
        return None

async def load_tts_model():
    """Check if the TTS model is loaded."""
    if tts is None:
        logger.error("TTS model is not loaded")
        raise RuntimeError("TTS model is not loaded")
    return tts

async def generate_voice(text, voice_speaker="morgan", message_uid=None, conversation_uid=None):
    """
    Generate voice for message
    
    Returns:
        Tuple[str, float]: The path to the generated voice file and its duration in seconds
    """
    try:
        if message_uid is None:
            message_uid = str(uuid.uuid4())
            
        logger.info(f"Generating voice for message: {message_uid}, conversation: {conversation_uid}")
        
        # Always use the data directory structure
        if conversation_uid:
            # Ensure the conversation_uid is a string
            conversation_uid = str(conversation_uid)
            logger.info(f"Using conversation UID: {conversation_uid}")
            
            convo_dir = os.path.join(CONVERSATION_DIR, conversation_uid)
            os.makedirs(convo_dir, exist_ok=True)
            file_path = os.path.join(convo_dir, f"message_{message_uid}.wav")
            logger.info(f"Voice will be generated to: {file_path}")
        else:
            # If no conversation_uid provided, use base conversation directory
            os.makedirs(CONVERSATION_DIR, exist_ok=True)
            file_path = os.path.join(CONVERSATION_DIR, f"message_{message_uid}.wav")
            logger.warning(f"No conversation_uid provided, using base path: {file_path}")
        
        # Find an appropriate voice sample
        speaker_wav_path = os.path.join(DEFAULT_VOICE_DIR, f"{voice_speaker}_cleaned.wav")
        
        if not os.path.exists(speaker_wav_path):
            speaker_wav_path = os.path.join(DEFAULT_VOICE_DIR, f"{voice_speaker}.wav")
            
        if not os.path.exists(speaker_wav_path):
            logger.warning(f"Speaker file not found: {speaker_wav_path}, using default")
            speaker_wav_path = os.path.join(DEFAULT_VOICE_DIR, "morgan_cleaned.wav")
        
        logger.info(f"Using voice sample: {speaker_wav_path}")
        tts_generate_speech(speaker_wav_path, text, file_path)
        
        # Verify the file was created
        if not os.path.exists(file_path):
            logger.error(f"Failed to generate voice file at: {file_path}")
            raise RuntimeError(f"Voice file not created at {file_path}")
            
        audio_duration = get_audio_duration(file_path)
        logger.info(f"Generated voice file with duration: {audio_duration:.2f} seconds at path: {file_path}")
        
        return file_path, audio_duration
    except Exception as e:
        logger.error(f"Error generating voice: {str(e)}")
        raise

async def use_custom_voice(agent_uid, file_path=None):
    """Store a custom voice file for an agent"""
    try:
        if not file_path:
            return None
            
        agent_dir = os.path.join(AGENT_DIR, agent_uid)
        os.makedirs(agent_dir, exist_ok=True)
        
        voice_filename = f"custom_voice_{uuid.uuid4()}.wav"
        dest_path = os.path.join(agent_dir, voice_filename)
        
        shutil.copy(file_path, dest_path)
        logger.info(f"Custom voice file copied to: {dest_path}")
        
        return dest_path
    except Exception as e:
        logger.error(f"Error processing custom voice: {str(e)}")
        return None

async def get_available_voices() -> List[Voice]:
    """Get a list of available voices."""
    try:
        voices = []
        
        for file in os.listdir(DEFAULT_VOICE_DIR):
            if file.endswith("_cleaned.wav"):
                voice_name = file.replace("_cleaned.wav", "")
                voice = Voice(
                    name=voice_name,
                    display_name=voice_name.replace("_", " ").title()
                )
                voices.append(voice)
        
        return voices
    except Exception as e:
        logger.error(f"Failed to get available voices: {e}")
        raise RuntimeError(f"Failed to get available voices: {e}")

async def get_voice_path(message_uid: str, conversation_uid: Optional[str] = None) -> Optional[str]:
    """Get the path to a voice file."""
    try:
        logger.info(f"Looking for voice file for message: {message_uid} in conversation: {conversation_uid}")
        
        if conversation_uid:
            # Look in the specific conversation directory
            path = os.path.join(CONVERSATION_DIR, conversation_uid, f"message_{message_uid}.wav")
            if os.path.exists(path):
                logger.info(f"Found voice file at path: {path}")
                return path
            else:
                logger.warning(f"Voice file not found at expected path: {path}")
        
        # Check base conversation directory if conversation_uid not provided or file not found
        base_path = os.path.join(CONVERSATION_DIR, f"message_{message_uid}.wav")
        if os.path.exists(base_path):
            logger.info(f"Found voice file in base conversation directory: {base_path}")
            return base_path
        
        # Search all conversation directories as a fallback
        for dir_name in os.listdir(CONVERSATION_DIR):
            if os.path.isdir(os.path.join(CONVERSATION_DIR, dir_name)):
                potential_path = os.path.join(CONVERSATION_DIR, dir_name, f"message_{message_uid}.wav")
                if os.path.exists(potential_path):
                    logger.info(f"Found voice file in conversation directory {dir_name}: {potential_path}")
                    return potential_path
        
        logger.warning(f"Voice file not found for message: {message_uid}")
        return None
    except Exception as e:
        logger.error(f"Failed to get voice path: {e}")
        return None 