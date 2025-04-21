import {
  API_BASE_URL,
  API_HEADERS,
  TTS_ENDPOINTS,
  fetchAPI,
} from "../config/api.config";

/**
 * Generate speech from text
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (optional)
 * @returns {Promise<Object>} - Response containing the generated speech data
 */
export const generateSpeech = async (text, voice = null) => {
  try {
    return await fetchAPI("/tts/generate", {
      method: "POST",
      body: JSON.stringify({
        text,
        voice,
      }),
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

/**
 * Download a generated speech file
 * @param {string} messageId - The ID of the message containing the speech
 * @param {string} conversationId - The ID of the conversation (optional)
 * @returns {Promise<Blob>} - The audio file as a blob
 */
export const downloadSpeech = async (messageId, conversationId = null) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${TTS_ENDPOINTS.DOWNLOAD(messageId, conversationId)}`,
      {
        method: "GET",
        headers: API_HEADERS,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download speech");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error downloading speech:", error);
    throw error;
  }
};

/**
 * Stream a generated speech file
 * @param {string} messageId - The ID of the message containing the speech
 * @param {string} conversationId - The ID of the conversation (optional)
 * @returns {Promise<Response>} - The streaming response
 */
export const streamSpeech = async (messageId, conversationId = null) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${TTS_ENDPOINTS.STREAM(messageId, conversationId)}`,
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

/**
 * Get available voices
 * @returns {Promise<Array>} - List of available voices
 */
export const getAvailableVoices = async () => {
  try {
    return await fetchAPI("/tts/voices");
  } catch (error) {
    console.error("Error getting available voices:", error);
    throw error;
  }
};
