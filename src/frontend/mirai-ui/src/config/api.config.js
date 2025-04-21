// API configuration for MirAI UI

// Base URL for API requests
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8005/mirai/api";

// WebSocket URL for real-time updates
export const WS_BASE_URL = (() => {
  // Determine if we're using HTTPS to select the appropriate WebSocket protocol
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  if (process.env.REACT_APP_WS_BASE_URL) {
    return process.env.REACT_APP_WS_BASE_URL;
  }

  // Extract hostname and port from API_BASE_URL or use default
  try {
    if (API_BASE_URL) {
      const url = new URL(API_BASE_URL);
      return `${protocol}//${url.hostname}:${url.port || "8005"}/mirai/api/ws`;
    }
  } catch (e) {
    console.error("Failed to parse API_BASE_URL for WebSocket connection:", e);
  }

  // Fallback to default
  return "ws://localhost:8005/mirai/api/ws";
})();

// Default headers for API requests
export const API_HEADERS = {
  "Content-Type": "application/json",
};

// Agent endpoints
export const AGENT_ENDPOINTS = {
  CREATE: "/agent",
  LIST: "/agent/list",
  GET: (agentId) => `/agent/${agentId}`,
  UPDATE: (agentId) => `/agent/${agentId}`,
  DELETE: (agentId) => `/agent/${agentId}`,
  UPLOAD_VOICE: "/agent/upload_voice",
};

// TTS endpoints
export const TTS_ENDPOINTS = {
  GENERATE: "/tts/generate",
  DOWNLOAD: (messageId, conversationId) =>
    `/tts/download/${messageId}${
      conversationId ? `?conversation_uid=${conversationId}` : ""
    }`,
  STREAM: (messageId, conversationId) =>
    `/tts/stream/${messageId}${
      conversationId ? `?conversation_uid=${conversationId}` : ""
    }`,
  VOICES: "/tts/voices",
};

// WebSocket endpoints
export const WS_ENDPOINTS = {
  GLOBAL: "global",
  CONVERSATION: (conversationId) => `conversation/${conversationId}`,
};

// Generic fetch function for API requests
export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: API_HEADERS,
      mode: "cors",
      credentials: "omit",
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `API request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};
