// Audio utilities for MirAI

const audioCache = new Map();
let currentAudio = null;
let isAudioPlaying = false;
let isPendingPlayback = false;
let isPaused = false;
let currentAudioId = null;

const eventCallbacks = {
  onPlaybackStart: [],
  onPlaybackEnd: [],
  onPlaybackPending: []
};

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
  
  window.addEventListener('customAudioPlayback', (event) => {
    if (event.detail && event.detail.messageId) {
      currentAudioId = event.detail.messageId;
      console.log('Audio playback started for message:', currentAudioId);
    }
  });
}

const dispatchAudioEvent = (eventName, data = null) => {
  if (typeof window !== 'undefined') {
    const event = data 
      ? new CustomEvent(eventName, { detail: data })
      : new CustomEvent(eventName);
    window.dispatchEvent(event);
  }
};

export const registerAudioCallback = (event, callback) => {
  if (eventCallbacks[event]) {
    eventCallbacks[event].push(callback);
    return true;
  }
  return false;
};

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

export const getAudioPlaybackState = () => {
  return {
    isPlaying: isAudioPlaying,
    isPending: isPendingPlayback,
    isPaused: isPaused,
    currentUrl: currentAudio?.src || null,
    currentAudioId: currentAudioId
  };
};

export const playMessageAudio = async (url, messageId = null) => {
  try {
    if (messageId) {
      currentAudioId = messageId;
    }
    
    if (isPaused && currentAudio && currentAudio.src === url) {
      isPaused = false;
      isAudioPlaying = true;
      const playPromise = currentAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            notifyCallbacks('onPlaybackStart');
            dispatchAudioEvent('audioPlaybackStart', { messageId: currentAudioId });
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

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    let audio = audioCache.get(url);

    if (!audio) {
      audio = new Audio(url);

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
        currentAudioId = null;
        notifyCallbacks('onPlaybackEnd');
        dispatchAudioEvent('audioPlaybackEnd');
      };

      audio.addEventListener("canplaythrough", () => {
        // Audio is loaded and ready to play
      });

      audioCache.set(url, audio);
    }

    audio.onended = () => {
      isPendingPlayback = false;
      isAudioPlaying = false;
      isPaused = false;
      notifyCallbacks('onPlaybackEnd');
      dispatchAudioEvent('audioPlaybackEnd');
    };

    const originalOnPause = audio.onpause;
    audio.onpause = (event) => {
      if (!isPaused) {
        isPendingPlayback = false;
        isAudioPlaying = false;
        notifyCallbacks('onPlaybackEnd');
        dispatchAudioEvent('audioPlaybackEnd');
      }
      if (originalOnPause) originalOnPause(event);
    };

    audio.load();

    currentAudio = audio;
    isPaused = false;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isAudioPlaying = true;
          isPendingPlayback = false;
          notifyCallbacks('onPlaybackStart');
          dispatchAudioEvent('audioPlaybackStart', { messageId: currentAudioId });
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

export const pauseCurrentAudio = () => {
  if (currentAudio && isAudioPlaying) {
    isPaused = true;
    isAudioPlaying = false;
    currentAudio.pause();
    
    notifyCallbacks('onPlaybackEnd');
    dispatchAudioEvent('audioPlaybackPaused');
    return true;
  }
  return false;
};

export const resumeCurrentAudio = () => {
  if (currentAudio && isPaused) {
    const playPromise = currentAudio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPaused = false;
          isAudioPlaying = true;
          notifyCallbacks('onPlaybackStart');
          dispatchAudioEvent('audioPlaybackStart', { messageId: currentAudioId });
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

export const stopCurrentAudio = () => {
  if (currentAudio) {
    isPaused = false;
    isAudioPlaying = false;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    
    notifyCallbacks('onPlaybackEnd');
    dispatchAudioEvent('audioPlaybackEnd');
    return true;
  }
  return false;
};

export const clearAudioCache = () => {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.src = '';
  });
  audioCache.clear();
  currentAudio = null;
  currentAudioId = null;
  isAudioPlaying = false;
  isPendingPlayback = false;
  isPaused = false;
  return true;
};
