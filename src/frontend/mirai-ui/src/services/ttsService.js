import {
  fetchAPI,
  ENDPOINTS,
  API_BASE_URL,
  API_HEADERS,
} from "../config/api.config";

export const generateSpeech = async (text, voice = null) => {
  return await fetchAPI(ENDPOINTS.TTS.GENERATE, {
    method: "POST",
    body: JSON.stringify({ text, voice }),
  });
};

export const downloadSpeech = async (messageId, conversationId = null) => {
  const endpoint = ENDPOINTS.TTS.DOWNLOAD(messageId, conversationId);
  const response = await fetchAPI(endpoint, { method: "GET" });
  return response;
};

export const streamSpeech = async (messageId, conversationId = null) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TTS.STREAM(messageId, conversationId)}`,
      {
        method: "GET",
        headers: API_HEADERS,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to stream speech");
    }

    return response;
  } catch (error) {
    console.error("Error streaming speech:", error);
    throw error;
  }
};

export const getAvailableVoices = async () => {
  try {
    return await fetchAPI(ENDPOINTS.TTS.VOICES);
  } catch (error) {
    console.error("Error getting available voices:", error);
    throw error;
  }
};
