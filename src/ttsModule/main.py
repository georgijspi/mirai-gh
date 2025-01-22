import os
import time
import torch
from ttsModule import generate_speech
from pydub import AudioSegment
from pydub.playback import play
from TTS.api import TTS

def main():
    """
    Loads the Coqui XTTS model, generates, and plays speech on demand.
    Measures and prints the time from input to speech playback.
    """

    # Input and output directories
    input_dir = "voicelines/cleaned"
    output_dir = "output"

    # Ensure input/output directories exist
    os.makedirs(input_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # Speaker sample file path
    speaker_wav_path = os.path.join(input_dir, "morgan_cleaned.wav") # Update with your file

    # Text to be read
    text = "Turmoil has engulfed the Galactic Republic. The taxation of trade routes to outlying star systems is in dispute. Hoping to resolve the matter with a blockade of deadly battleships, the greedy Trade Federation has stopped all shipping to the small planet of Naboo."

    # Load the model onto the GPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    print("Model loaded onto", device)

    while True:
        # Wait for user input to start generation
        input("Press Enter to generate speech...")


        # Generate speech (using the optimized function in ttsModule)
        output_path = os.path.join(output_dir, "output.wav")

        start_time = time.time()
        
        generate_speech(tts, speaker_wav_path, text, output_path)

        
        end_time = time.time()
        
        # Play the generated audio
        audio = AudioSegment.from_wav(output_path)
        
        play(audio)


        # Calculate and print the time taken
        elapsed_time = end_time - start_time
        print(f"Time from input to playback: {elapsed_time:.4f} seconds")

if __name__ == "__main__":
    main()