// Audio utilities for MirAI

const audioCache = new Map();
let currentAudio = null;

// Function to play message audio from URL
export const playMessageAudio = async (url, onEnded = null) => {
  try {
    console.log(`Attempting to play audio from URL: ${url}`);

    // Stop any currently playing audio
    if (currentAudio) {
      console.log("Stopping current audio playback");
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Check if audio is in cache
    let audio = audioCache.get(url);

    if (!audio) {
      console.log("Creating new audio element");
      // Create a new audio element if not in cache
      audio = new Audio(url);

      // Add error handling
      audio.onerror = (e) => {
        console.error(
          `Audio error (${e.target.error?.code}): ${
            e.target.error?.message || "Unknown error"
          }`,
          e
        );
      };

      // Listen for the canplaythrough event to ensure the audio is loaded
      audio.addEventListener("canplaythrough", () => {
        console.log("Audio loaded and ready to play");
      });

      audioCache.set(url, audio);
    } else {
      console.log("Using cached audio element");
    }

    // Set onended callback
    if (onEnded) {
      audio.onended = onEnded;
    }

    // Preload the audio
    audio.load();

    // Set current audio
    currentAudio = audio;

    // Play the audio
    console.log("Starting audio playback");
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Audio playback started successfully");
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          // Try to play again with user interaction if autoplay was prevented
          if (error.name === "NotAllowedError") {
            console.warn(
              "Autoplay prevented by browser. Audio requires user interaction to play."
            );
          }
        });
    }

    return true;
  } catch (error) {
    console.error("Error playing audio:", error);
    return false;
  }
};

// Function to stop any currently playing audio
export const stopCurrentAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    return true;
  }
  return false;
};

// Function to clear the audio cache
export const clearAudioCache = () => {
  stopCurrentAudio();
  audioCache.clear();
};
