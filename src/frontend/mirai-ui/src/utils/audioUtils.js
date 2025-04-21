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

/**
 * WebSocketManager - Manages WebSocket connections for conversation updates
 */
export class WebSocketManager {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.socket = null;
    this.messageHandlers = [];
    this.endpoint = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // Start with 2 seconds
  }

  /**
   * Connect to a WebSocket endpoint
   * @param {string} endpoint - The endpoint to connect to (e.g. 'global' or 'conversation/abc123')
   */
  connect(endpoint) {
    if (this.socket && this.isConnected && this.endpoint === endpoint) {
      console.log("Already connected to this endpoint, skipping");
      return;
    }

    // Close existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    this.endpoint = endpoint;
    const url = `${this.baseUrl}/${endpoint}`;

    console.log(`Connecting to WebSocket at ${url}`);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log(`WebSocket connected to ${url}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        // Notify all handlers
        this.messageHandlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error("Error in message handler:", error);
          }
        });
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      this.isConnected = false;

      // Attempt to reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay =
          this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
        console.log(`Attempting to reconnect in ${delay}ms...`);

        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(this.endpoint);
        }, delay);
      } else {
        console.error("Maximum reconnection attempts reached. Giving up.");
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.endpoint = null;
      console.log("WebSocket disconnected");
    }
  }

  /**
   * Add a message handler function
   * @param {Function} handler - Function to call when a message is received
   * @returns {Function} - Function to remove the handler
   */
  addMessageHandler(handler) {
    this.messageHandlers.push(handler);

    // Return a function to remove this handler
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index !== -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }
}
