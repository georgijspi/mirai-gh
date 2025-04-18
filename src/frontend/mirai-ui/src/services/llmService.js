const API_BASE_URL = "http://localhost:8005/mirai/api";

export const fetchLLMConfigs = async (includeArchived = true) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/llm/config?include_archived=${includeArchived}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch LLM configurations");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching LLM configurations:", error);
    throw error;
  }
};

export const fetchLLMConfigByUid = async (configUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/config/${configUid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch LLM configuration");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching LLM configuration:", error);
    throw error;
  }
};

export const fetchAvailableModels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/ollama/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch available models");
    }
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error("Error fetching available models:", error);
    throw error;
  }
};

export const pullModel = async (modelName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/llm/ollama/pull?model_name=${encodeURIComponent(
        modelName
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to pull model");
    }
    return await response.json();
  } catch (error) {
    console.error("Error pulling model:", error);
    throw error;
  }
};

export const deleteModel = async (modelName) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/llm/ollama/delete?model_name=${encodeURIComponent(
        modelName
      )}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete model");
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting model:", error);
    throw error;
  }
};

export const createLLMConfig = async (configData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(configData),
    });
    if (!response.ok) {
      throw new Error("Failed to create LLM configuration");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating LLM configuration:", error);
    throw error;
  }
};

export const deleteLLMConfig = async (configUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/config/${configUid}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete LLM configuration");
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting LLM configuration:", error);
    throw error;
  }
};

export const updateLLMConfig = async (configUid, configData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/config/${configUid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(configData),
    });
    if (!response.ok) {
      throw new Error("Failed to update LLM configuration");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating LLM configuration:", error);
    throw error;
  }
};
