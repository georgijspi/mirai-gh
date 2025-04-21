import React, { useState } from "react";

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

// Conversation endpoints
export const CONVERSATION_ENDPOINTS = {
  CREATE: "/conversation",
  LIST: "/conversation/list",
  GET: (conversationId) => `/conversation/${conversationId}`,
  UPDATE: (conversationId) => `/conversation/${conversationId}`,
  DELETE: (conversationId) => `/conversation/${conversationId}`,
  SEND_MESSAGE: "/conversation/send_message",
  RATE_MESSAGE: "/conversation/rate_message",
};

// Global conversation endpoints
export const GLOBAL_CONVERSATION_ENDPOINTS = {
  GET: "/global_conversation",
  SEND_MESSAGE: "/global_conversation/send_message",
  RATE_MESSAGE: "/global_conversation/rate_message",
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

const APIModuleConfig = () => {
  const [modules, setModules] = useState([
    { name: "Weather", apiKey: "", endpoint: "", prompt: "" },
    { name: "News", apiKey: "", endpoint: "", prompt: "" },
    { name: "Calendar", apiKey: "", endpoint: "", prompt: "" },
  ]);

  const addModule = () => {
    setModules([
      ...modules,
      { name: "New Module", apiKey: "", endpoint: "", prompt: "" },
    ]);
  };

  const updateModule = (index, field, value) => {
    const updatedModules = [...modules];
    updatedModules[index][field] = value;
    setModules(updatedModules);
    localStorage.setItem("apiModules", JSON.stringify(updatedModules));
  };

  const removeModule = (index) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    setModules(updatedModules);
    localStorage.setItem("apiModules", JSON.stringify(updatedModules));
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        API Module Configuration
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-4"
          >
            <input
              type="text"
              value={module.name}
              onChange={(e) => updateModule(index, "name", e.target.value)}
              placeholder="Module Name"
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={module.apiKey}
              onChange={(e) => updateModule(index, "apiKey", e.target.value)}
              placeholder="API Key"
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={module.endpoint}
              onChange={(e) => updateModule(index, "endpoint", e.target.value)}
              placeholder="API Endpoint"
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={module.prompt}
              onChange={(e) => updateModule(index, "prompt", e.target.value)}
              placeholder="Sample Prompt"
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeModule(index)}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition mb-2"
            >
              Remove
            </button>
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition">
              Save
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addModule}
        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition mt-6"
      >
        Add New API Module
      </button>
    </div>
  );
};

export default APIModuleConfig;
