// Audio utilities for MirAI

const audioCache = new Map();
let currentAudio = null;
let isAudioPlaying = false;
let isPendingPlayback = false;
let isPaused = false;

// Event callbacks
const eventCallbacks = {
  onPlaybackStart: [],
  onPlaybackEnd: [],
  onPlaybackPending: []
};

// Initialize event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('audioPlaybackPending', () => {
    console.log('Audio playback pending event received');
    isPendingPlayback = true;
    notifyCallbacks('onPlaybackPending');
  });
  
  window.addEventListener('audioPlaybackFailed', () => {
    console.log('Audio playback failed event received');
    isPendingPlayback = false;
    if (!isAudioPlaying) {
      notifyCallbacks('onPlaybackEnd');
    }
  });
}

// Helper function to dispatch events
const dispatchAudioEvent = (eventName) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(eventName);
    window.dispatchEvent(event);
  }
};

// Function to register event callbacks
export const registerAudioCallback = (event, callback) => {
  if (eventCallbacks[event]) {
    eventCallbacks[event].push(callback);
    return true;
  }
  return false;
};

// Function to unregister event callbacks
export const unregisterAudioCallback = (event, callback) => {
  if (eventCallbacks[event]) {
    const index = eventCallbacks[event].indexOf(callback);
    if (index !== -1) {
      eventCallbacks[event].splice(index, 1);
      return true;
    }
  }
  return false;
};

// Function to notify all registered callbacks
const notifyCallbacks = (event) => {
  if (eventCallbacks[event]) {
    eventCallbacks[event].forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    });
  }
};

// Function to get current audio playback state
export const getAudioPlaybackState = () => {
  return {
    isPlaying: isAudioPlaying,
    isPending: isPendingPlayback,
    isPaused: isPaused,
    currentUrl: currentAudio?.src || null
  };
};

// Function to play message audio from URL
export const playMessageAudio = async (url, onEnded = null) => {
  try {
    // If we're resuming from a pause with the same audio
    if (isPaused && currentAudio && currentAudio.src === url) {
      isPaused = false;
      isAudioPlaying = true;
      const playPromise = currentAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            notifyCallbacks('onPlaybackStart');
            dispatchAudioEvent('audioPlaybackStart');
          })
          .catch((error) => {
            console.error("Error resuming audio:", error);
            isPendingPlayback = false;
            isAudioPlaying = false;
            notifyCallbacks('onPlaybackEnd');
            dispatchAudioEvent('audioPlaybackEnd');
          });
      }
      return true;
    }

    // We're playing a new audio file, stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Check if audio is in cache
    let audio = audioCache.get(url);

    if (!audio) {
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
        isPendingPlayback = false;
        isAudioPlaying = false;
        isPaused = false;
        notifyCallbacks('onPlaybackEnd');
        dispatchAudioEvent('audioPlaybackEnd');
      };

      audio.addEventListener("canplaythrough", () => {
        // Audio is loaded and ready to play
      });

      audioCache.set(url, audio);
    }

    // Set onended callback
    audio.onended = () => {
      isPendingPlayback = false;
      isAudioPlaying = false;
      isPaused = false;
      notifyCallbacks('onPlaybackEnd');
      dispatchAudioEvent('audioPlaybackEnd');
      if (onEnded) onEnded();
    };

    // Set up event listener for pause - only dispatch event if it's not our internal pause
    const originalOnPause = audio.onpause;
    audio.onpause = (event) => {
      // Don't update state on programmatic pause when we're just pausing temporarily
      if (!isPaused) {
        isPendingPlayback = false;
        isAudioPlaying = false;
        notifyCallbacks('onPlaybackEnd');
        dispatchAudioEvent('audioPlaybackEnd');
      }
      if (originalOnPause) originalOnPause(event);
    };

    // Preload the audio
    audio.load();

    // Set current audio
    currentAudio = audio;
    isPaused = false;

    // Play the audio
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isAudioPlaying = true;
          isPendingPlayback = false;
          notifyCallbacks('onPlaybackStart');
          dispatchAudioEvent('audioPlaybackStart');
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          isPendingPlayback = false;
          isAudioPlaying = false;
          isPaused = false;
          notifyCallbacks('onPlaybackEnd');
          dispatchAudioEvent('audioPlaybackEnd');
          
          if (error.name === "NotAllowedError") {
            console.warn("Autoplay prevented by browser. Audio requires user interaction to play.");
          }
        });
    }

    return true;
  } catch (error) {
    console.error("Error playing audio:", error);
    isPendingPlayback = false;
    isAudioPlaying = false;
    isPaused = false;
    notifyCallbacks('onPlaybackEnd');
    dispatchAudioEvent('audioPlaybackEnd');
    return false;
  }
};

// Function to pause currently playing audio without resetting position
export const pauseCurrentAudio = () => {
  if (currentAudio && isAudioPlaying) {
    isPaused = true;
    isAudioPlaying = false;
    currentAudio.pause();
    // We don't reset currentTime here to maintain position
    
    // Notify that playback is paused (a special type of end)
    notifyCallbacks('onPlaybackEnd');
    dispatchAudioEvent('audioPlaybackPaused');
    return true;
  }
  return false;
};

// Function to resume paused audio
export const resumeCurrentAudio = () => {
  if (currentAudio && isPaused) {
    const playPromise = currentAudio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPaused = false;
          isAudioPlaying = true;
          notifyCallbacks('onPlaybackStart');
          dispatchAudioEvent('audioPlaybackStart');
          return true;
        })
        .catch((error) => {
          console.error("Error resuming audio:", error);
          return false;
        });
    }
  }
  return false;
};

// Function to stop any currently playing audio (resets position)
export const stopCurrentAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    isPendingPlayback = false;
    isAudioPlaying = false;
    isPaused = false;
    notifyCallbacks('onPlaybackEnd');
    dispatchAudioEvent('audioPlaybackEnd');
    return true;
  }
  return false;
};

// Function to clear the audio cache
export const clearAudioCache = () => {
  stopCurrentAudio();
  audioCache.clear();
};
