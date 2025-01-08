import torch
from TTS.api import TTS

device = "cuda" if torch.cuda.is_available() else "cpu"

# Define paths to your data and config files
wav_file_path = "voicelines/cleaned/rifleman_clean.wav"  # Path to your wav file
output_audio_path = "output"        # Directory where model will be saved
# config_path = "config.json"          # Coqui TTS config file

tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)

def generate_audio(
    text="A long time ago in a galaxy far, far away. A child was born of the force."):
    tts.tts_to_file(
        text="I'm a barbie girl, unequivocally in a barbie world. Life, it is, in plastic, and surely, it's fantastic.",
        file_path=output_audio_path,
        speaker_wav=wav_file_path,
        language="en")
    return output_audio_path
    
print(generate_audio())

