import { fetchAPI, ENDPOINTS } from "../config/api.config";

export const fetchLLMConfigs = async (includeArchived = true) => {
  return await fetchAPI(
    `${ENDPOINTS.LLM.CONFIG}?include_archived=${includeArchived}`
  );
};

export const fetchLLMConfigByUid = async (configUid) => {
  return await fetchAPI(ENDPOINTS.LLM.GET(configUid));
};

export const fetchAvailableModels = async () => {
  const data = await fetchAPI(ENDPOINTS.LLM.LIST_MODELS);
  return data.models || [];
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

export const createLLMConfig = async (configData) => {
  return await fetchAPI(ENDPOINTS.LLM.CONFIG, {
    method: "POST",
    body: JSON.stringify(configData),
  });
};

export const deleteLLMConfig = async (configUid) => {
  return await fetchAPI(ENDPOINTS.LLM.DELETE(configUid), {
    method: "DELETE",
  });
};

export const updateLLMConfig = async (configUid, configData) => {
  return await fetchAPI(ENDPOINTS.LLM.UPDATE(configUid), {
    method: "PUT",
    body: JSON.stringify(configData),
  });
};
