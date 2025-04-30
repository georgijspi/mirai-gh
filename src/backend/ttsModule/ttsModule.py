import os
import torch
import logging
import time
import re
import uuid
import concurrent.futures
import subprocess
import threading

# Set environment variable for PyTorch 2.6+
os.environ["TORCH_LOAD_WEIGHTS_ONLY"] = "0"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize a lock for thread-safe access to the TTS model
tts_lock = threading.Lock()

# Try to add necessary classes to safe_globals (for PyTorch 2.6+)
try:
    if hasattr(torch.serialization, "add_safe_globals"):
        # Register classes needed for deserialization
        from TTS.tts.configs.xtts_config import XttsConfig
        from TTS.tts.models.xtts import Xtts, XttsAudioConfig, XttsArgs
        from TTS.config.shared_configs import BaseDatasetConfig
        from TTS.tts.models.base_tts import BaseTTS
        from TTS.encoder.configs.base_encoder_config import BaseEncoderConfig

        # Add relevant classes to safe_globals
        classes = [
            XttsConfig,
            Xtts,
            XttsAudioConfig,
            BaseDatasetConfig,
            BaseTTS,
            BaseEncoderConfig,
            XttsArgs,
        ]
        torch.serialization.add_safe_globals(classes)
        logger.info("Added TTS model classes to PyTorch safe_globals")
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


def split_into_sentences(text):
    """Split text into sentences using regex."""
    # First replace ellipses with a placeholder to avoid splitting them
    text = text.replace('...', '<ELLIPSIS>')
    
    # Split on sentence terminators (., !, ?) followed by space or end of string
    sentences = re.split(
        r'(?<=[.!?])\s+|(?<=[.!?])$', 
        text
    )
    
    # Restore ellipses
    sentences = [s.replace('<ELLIPSIS>', '...') for s in sentences]
    
    # Remove empty strings
    sentences = [s for s in sentences if s.strip()]
    
    return sentences


def generate_speech_chunk(speaker_wav_path, text, output_path, chunk_id):
    """Generate speech for a single chunk of text."""
    if tts is None:
        raise RuntimeError("TTS model is not loaded")

    logger.info(f"Starting processing sentence {chunk_id}: '{text[:30]}...'")
    chunk_start_time = time.time()
    
    try:
        # Use a lock to ensure only one thread accesses the TTS model at a time
        with tts_lock:
            # Generate the speech
            tts.tts_to_file(
                text=text,
                speaker_wav=speaker_wav_path,
                language="en",
                file_path=output_path,
            )
        
        duration = time.time() - chunk_start_time
        logger.info(f"Completed sentence {chunk_id} in {duration:.2f} seconds")
        return output_path, chunk_id, duration
    except Exception as e:
        logger.error(f"Error processing sentence {chunk_id}: {e}")
        raise


def combine_audio_files(audio_files, output_path):
    """Combine multiple audio files into one using ffmpeg."""
    try:
        # Create a text file listing all input files
        temp_list_file = f"{output_path}.list"
        with open(temp_list_file, 'w') as f:
            for audio_file in audio_files:
                f.write(f"file '{audio_file}'\n")
        
        # Use ffmpeg to concatenate files
        subprocess.run(
            ['ffmpeg', '-f', 'concat', '-safe', '0', '-i', temp_list_file, 
             '-c', 'copy', output_path],
            check=True,
            capture_output=True
        )
        
        # Clean up the temporary list file
        os.remove(temp_list_file)
        
        return output_path
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg error: {e.stdout.decode()} {e.stderr.decode()}")
        raise
    except Exception as e:
        logger.error(f"Error combining audio files: {e}")
        raise


def generate_speech(speaker_wav_path, text, output_path):
    """
    Text to speech generation using Coqui XTTS with sequential per-sentence processing.
    
    Breaks text into sentences and processes them one at a time, but loads the entire
    model only once.

    speaker_wav_path: Path to the sample audio file for voice cloning.
    text: The text to synthesize.
    output_path: Path to save the generated .wav file.
    """
    if tts is None:
        raise RuntimeError("TTS model is not loaded")

    if not os.path.exists(speaker_wav_path):
        raise FileNotFoundError(
            f"Speaker WAV file not found at {speaker_wav_path}"
        )

    try:
        start_time = time.time()
        
        # Create output directory
        output_dir = os.path.dirname(output_path)
        os.makedirs(output_dir, exist_ok=True)
        
        # Create a temporary directory for sentence chunks
        temp_dir = os.path.join(output_dir, f"temp_{uuid.uuid4().hex}")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Split text into sentences
        sentences = split_into_sentences(text)
        logger.info(
            f"Split text into {len(sentences)} sentences for processing"
        )
        
        # Short-circuit for single sentence
        if len(sentences) == 1:
            generate_speech_chunk(speaker_wav_path, text, output_path, 1)
            logger.info(
                f"Speech generated in {time.time() - start_time:.2f}s (single sentence)"
            )
            return output_path
        
        # Generate temporary filenames for each sentence
        temp_files = [
            os.path.join(temp_dir, f"sentence_{i}.wav") 
            for i in range(len(sentences))
        ]
        
        # Process sentences in thread pool (but with lock for TTS access)
        completed_files = []
        ordered_files = [None] * len(sentences)
        
        # Use a small number of workers since we're locking anyway
        max_workers = min(4, len(sentences))
        logger.info(f"Using {max_workers} workers for TTS processing")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_index = {}
            for i, sentence in enumerate(sentences):
                if sentence.strip():  # Skip empty sentences
                    future = executor.submit(
                        generate_speech_chunk,
                        speaker_wav_path,
                        sentence,
                        temp_files[i],
                        i + 1
                    )
                    future_to_index[future] = i
            
            # Process results as they complete
            for future in concurrent.futures.as_completed(future_to_index):
                idx = future_to_index[future]
                try:
                    file_path, chunk_id, duration = future.result()
                    ordered_files[idx] = file_path
                    completed_files.append(file_path)
                    logger.info(
                        f"Added sentence {chunk_id} to queue (duration: {duration:.2f}s)"
                    )
                except Exception as e:
                    logger.error(f"Error in sentence processing: {e}")
        
        # Remove None values from ordered_files (in case some failed)
        ordered_files = [f for f in ordered_files if f is not None]
        
        # Combine all audio files in the correct order
        if ordered_files:
            logger.info(f"Combining {len(ordered_files)} audio segments")
            combine_audio_files(ordered_files, output_path)
            
            # Clean up temporary files and directory
            for file in completed_files:
                try:
                    os.remove(file)
                except OSError:
                    pass
            try:
                os.rmdir(temp_dir)
            except OSError:
                pass
                
            generation_time = time.time() - start_time
            logger.info(
                f"Speech generated in {generation_time:.2f}s with parallel processing"
            )
            return output_path
        else:
            raise RuntimeError("No sentences were successfully processed")
        
    except Exception as e:
        logger.error(f"Error in speech generation: {e}")
        raise
