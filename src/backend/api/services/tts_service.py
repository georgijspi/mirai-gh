import logging
import os
import re
import time
import torch
import uuid
import shutil
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path

from ..models import Voice
from ttsModule.ttsModule import generate_speech as tts_generate_speech, tts

logger = logging.getLogger(__name__)

# Directory structure
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "data")
CONVERSATION_DIR = os.path.join(DATA_DIR, "conversation")
LEGACY_VOICELINES_DIR = os.path.join("ttsModule", "voicelines")
LEGACY_MESSAGES_DIR = os.path.join(LEGACY_VOICELINES_DIR, "messages")
CLEANED_VOICE_DIR = os.path.join(LEGACY_VOICELINES_DIR, "cleaned")

# Ensure directories exist
os.makedirs(CONVERSATION_DIR, exist_ok=True)
os.makedirs(LEGACY_MESSAGES_DIR, exist_ok=True)
os.makedirs(CLEANED_VOICE_DIR, exist_ok=True)

def clean_text(text: str) -> str:
    """Clean text for TTS processing."""
    # Replace newlines with spaces
    text = re.sub(r'\n+', ' ', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

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
        # Clean the text for better TTS results
        cleaned_text = clean_text(text)
        
        # Ensure the output directory exists
        if not output_dir:
            output_dir = CONVERSATION_DIR
        os.makedirs(output_dir, exist_ok=True)
        
        # Determine the output filename
        filename = f"message_{message_uid}.wav"
        output_path = os.path.join(output_dir, filename)
        
        # Default speaker sample
        speaker_wav_path = os.path.join(CLEANED_VOICE_DIR, "morgan_cleaned.wav")
        
        # Use custom voice if provided
        if custom_voice_path and os.path.exists(custom_voice_path):
            speaker_wav_path = custom_voice_path
            logger.info(f"Using custom voice: {custom_voice_path}")
        
        # Generate speech
        tts_generate_speech(speaker_wav_path, cleaned_text, output_path)
        
        # Check if file was created
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
    """Generate voice for message"""
    try:
        # Create a unique ID for the message if not provided
        if message_uid is None:
            message_uid = str(uuid.uuid4())
        
        # Define base paths
        base_path = os.path.join(os.getcwd(), "..", "data")
        
        # Define paths for conversation-specific voice lines
        if conversation_uid:
            # Create directory structure if it doesn't exist
            convo_dir = os.path.join(base_path, "conversation", conversation_uid)
            os.makedirs(convo_dir, exist_ok=True)
            
            # Set the path for the voice file
            file_path = os.path.join(convo_dir, f"message_{message_uid}.wav")
        else:
            # Fallback to legacy path structure if no conversation_uid provided
            legacy_dir = os.path.join(os.getcwd(), "ttsModule", "voicelines", "messages")
            os.makedirs(legacy_dir, exist_ok=True)
            file_path = os.path.join(legacy_dir, f"message_{message_uid}.wav")
        
        logger.info(f"Generating voice to: {file_path}")
        
        # Find the speaker file - first try with _cleaned suffix
        speaker_wav_path = os.path.join(CLEANED_VOICE_DIR, f"{voice_speaker}_cleaned.wav")
        
        # If not found, try without the _cleaned suffix
        if not os.path.exists(speaker_wav_path):
            speaker_wav_path = os.path.join(CLEANED_VOICE_DIR, f"{voice_speaker}.wav")
            
        # If still not found, fall back to default
        if not os.path.exists(speaker_wav_path):
            logger.warning(f"Speaker file not found: {speaker_wav_path}, using default")
            speaker_wav_path = os.path.join(CLEANED_VOICE_DIR, "morgan_cleaned.wav")
        
        # Generate voice
        tts_generate_speech(speaker_wav_path, text, file_path)
        
        return file_path
    except Exception as e:
        logger.error(f"Error generating voice: {str(e)}")
        raise

async def use_custom_voice(agent_uid, file_path=None):
    """Store a custom voice file for an agent"""
    try:
        if not file_path:
            return None
            
        # Create the agent directory if it doesn't exist
        agent_dir = os.path.join(os.getcwd(), "..", "data", "agent", agent_uid)
        os.makedirs(agent_dir, exist_ok=True)
        
        # Generate a unique name for the voice file
        voice_filename = f"custom_voice_{uuid.uuid4()}.wav"
        
        # Set the destination path
        dest_path = os.path.join(agent_dir, voice_filename)
        
        # Copy the file
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
        
        # Get the files in the cleaned directory
        for file in os.listdir(CLEANED_VOICE_DIR):
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
        # Check new directory structure first
        if conversation_uid:
            new_path = os.path.join(CONVERSATION_DIR, conversation_uid, f"message_{message_uid}.wav")
            if os.path.exists(new_path):
                return new_path
        
        # Check legacy directory
        legacy_path = os.path.join(LEGACY_MESSAGES_DIR, f"message_{message_uid}.wav")
        if os.path.exists(legacy_path):
            return legacy_path
        
        return None
    except Exception as e:
        logger.error(f"Failed to get voice path: {e}")
        return None 