export const API_BASE_URL = (() => {
  // Use environment variable if defined
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // Dynamically determine the backend URL based on current hostname
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // Keep using the standard backend port
  return `${protocol}//${hostname}:8005/mirai/api`;
})();

export const WS_BASE_URL = (() => {
  // Use environment variable if defined
  if (process.env.REACT_APP_WS_BASE_URL) {
    return process.env.REACT_APP_WS_BASE_URL;
  }

  // Dynamically determine WebSocket URL using the same hostname
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;
  
  return `${protocol}//${hostname}:8005/mirai/api/ws`;
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
    CREATE: "/conversation",
    LIST: "/conversation/list",
    GET: (conversationUid) => `/conversation/${conversationUid}`,
    UPDATE: (conversationUid) => `/conversation/${conversationUid}`,
    DELETE: (conversationUid) => `/conversation/${conversationUid}`,
    SEND_MESSAGE: "/conversation/send_message",
    RATE_MESSAGE: "/conversation/rate_message",
  },
  GLOBAL_CONVERSATION: {
    GET: "/global_conversation",
    SEND_MESSAGE: "/global_conversation/send_message",
    RATE_MESSAGE: "/global_conversation/rate_message",
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
  const headers = { ...API_HEADERS, ...options.headers };

  // Remove Content-Type if body is FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    mode: "cors",
    credentials: "omit",
  });

  try {
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
