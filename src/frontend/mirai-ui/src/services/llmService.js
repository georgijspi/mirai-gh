import { API_BASE_URL } from "../config/apiConfig";
import { fetchAPI, ENDPOINTS } from "../config/api.config";

// Fetch all LLM configurations
export const fetchLlmConfigs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/configs`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch LLM configurations');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching LLM configurations:', error);
    throw error;
  }
};

// Fetch a single LLM configuration by UID
export const fetchLlmConfigByUid = async (llmConfigUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/configs/${llmConfigUid}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch LLM configuration');
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching LLM configuration ${llmConfigUid}:`, error);
    throw error;
  }
};

// Create a new LLM configuration
export const createLlmConfig = async (configData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/configs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create LLM configuration');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error creating LLM configuration:', error);
    throw error;
  }
};

// Update an existing LLM configuration
export const updateLlmConfig = async (llmConfigUid, configData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/configs/${llmConfigUid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update LLM configuration');
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error updating LLM configuration ${llmConfigUid}:`, error);
    throw error;
  }
};

// Delete an LLM configuration
export const deleteLlmConfig = async (llmConfigUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/configs/${llmConfigUid}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete LLM configuration');
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting LLM configuration ${llmConfigUid}:`, error);
    throw error;
  }
};

export const fetchAvailableModels = async () => {
  return await fetchAPI(ENDPOINTS.LLM.LIST_MODELS);
};

export const pullModel = async (modelName) => {
  return await fetchAPI(
    `${ENDPOINTS.LLM.PULL_MODEL}?model_name=${encodeURIComponent(modelName)}`,
    {
      method: "POST",
    }
  );
};

export const deleteModel = async (modelName) => {
  return await fetchAPI(
    `${ENDPOINTS.LLM.DELETE_MODEL}?model_name=${encodeURIComponent(modelName)}`,
    {
      method: "DELETE",
    }
  );
};

// Aliases for backward compatibility
export const fetchLLMConfigs = fetchLlmConfigs;
export const fetchLLMConfigByUid = fetchLlmConfigByUid;
export const createLLMConfig = createLlmConfig;
export const updateLLMConfig = updateLlmConfig;
export const deleteLLMConfig = deleteLlmConfig;
