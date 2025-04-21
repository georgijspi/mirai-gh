export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8005/mirai/api";

export const WS_BASE_URL = (() => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  if (process.env.REACT_APP_WS_BASE_URL) {
    return process.env.REACT_APP_WS_BASE_URL;
  }

  try {
    if (API_BASE_URL) {
      const url = new URL(API_BASE_URL);
      return `${protocol}//${url.hostname}:${url.port || "8005"}/mirai/api/ws`;
    }
  } catch (e) {
    console.error("Failed to parse API_BASE_URL for WebSocket connection:", e);
  }

  return "ws://localhost:8005/mirai/api/ws";
})();

export const API_HEADERS = {
  "Content-Type": "application/json",
};

export const ENDPOINTS = {
  AGENT: {
    CREATE: "/agent",
    LIST: "/agent/list",
    GET: (agentId) => `/agent/${agentId}`,
    UPDATE: (agentId) => `/agent/${agentId}`,
    DELETE: (agentId) => `/agent/${agentId}`,
    UPLOAD_VOICE: "/agent/upload_voice",
  },
  TTS: {
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
  },
  WS: {
    GLOBAL: "global",
    CONVERSATION: (conversationId) => `conversation/${conversationId}`,
  },
  CONVERSATION: {
    CREATE: "",
    LIST: "/list",
    GET: (conversationUid) => `/${conversationUid}`,
    UPDATE: (conversationUid) => `/${conversationUid}`,
    DELETE: (conversationUid) => `/${conversationUid}`,
    SEND_MESSAGE: "/send_message",
    RATE_MESSAGE: "/rate_message",
  },
  LLM: {
    CONFIG: "/llm/config",
    GET: (configUid) => `/llm/config/${configUid}`,
    LIST_MODELS: "/llm/ollama/list",
    PULL_MODEL: "/llm/ollama/pull",
    DELETE_MODEL: "/llm/ollama/delete",
    UPDATE: (configUid) => `/llm/config/${configUid}`,
    DELETE: (configUid) => `/llm/config/${configUid}`,
  },
};

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
