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
LEGACY_VOICELINES_DIR = os.path.join("ttsModule", "voicelines")
LEGACY_MESSAGES_DIR = os.path.join(LEGACY_VOICELINES_DIR, "messages")
CLEANED_VOICE_DIR = os.path.join(LEGACY_VOICELINES_DIR, "cleaned")

# Ensure directories exist
os.makedirs(CONVERSATION_DIR, exist_ok=True)
os.makedirs(LEGACY_MESSAGES_DIR, exist_ok=True)
os.makedirs(CLEANED_VOICE_DIR, exist_ok=True)

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
        
        speaker_wav_path = os.path.join(CLEANED_VOICE_DIR, "morgan_cleaned.wav")
        
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
        
        base_path = os.path.join(os.getcwd(), "..", "data")
        
        if conversation_uid:
            convo_dir = os.path.join(base_path, "conversation", conversation_uid)
            os.makedirs(convo_dir, exist_ok=True)
            file_path = os.path.join(convo_dir, f"message_{message_uid}.wav")
        else:
            legacy_dir = os.path.join(os.getcwd(), "ttsModule", "voicelines", "messages")
            os.makedirs(legacy_dir, exist_ok=True)
            file_path = os.path.join(legacy_dir, f"message_{message_uid}.wav")
        
        logger.info(f"Generating voice to: {file_path}")
        
        speaker_wav_path = os.path.join(CLEANED_VOICE_DIR, f"{voice_speaker}_cleaned.wav")
        
        if not os.path.exists(speaker_wav_path):
            speaker_wav_path = os.path.join(CLEANED_VOICE_DIR, f"{voice_speaker}.wav")
            
        if not os.path.exists(speaker_wav_path):
            logger.warning(f"Speaker file not found: {speaker_wav_path}, using default")
            speaker_wav_path = os.path.join(CLEANED_VOICE_DIR, "morgan_cleaned.wav")
        
        tts_generate_speech(speaker_wav_path, text, file_path)
        
        audio_duration = get_audio_duration(file_path)
        logger.info(f"Generated voice file with duration: {audio_duration:.2f} seconds")
        
        return file_path, audio_duration
    except Exception as e:
        logger.error(f"Error generating voice: {str(e)}")
        raise

async def use_custom_voice(agent_uid, file_path=None):
    """Store a custom voice file for an agent"""
    try:
        if not file_path:
            return None
            
        agent_dir = os.path.join(os.getcwd(), "..", "data", "agent", agent_uid)
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
        if conversation_uid:
            new_path = os.path.join(CONVERSATION_DIR, conversation_uid, f"message_{message_uid}.wav")
            if os.path.exists(new_path):
                return new_path
        
        legacy_path = os.path.join(LEGACY_MESSAGES_DIR, f"message_{message_uid}.wav")
        if os.path.exists(legacy_path):
            return legacy_path
        
        return None
    except Exception as e:
        logger.error(f"Failed to get voice path: {e}")
        return None 