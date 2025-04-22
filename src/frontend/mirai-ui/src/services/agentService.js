import { fetchAPI, ENDPOINTS, API_BASE_URL } from "../config/api.config";

export const fetchAgents = async (includeArchived = false) => {
  const data = await fetchAPI(
    `${ENDPOINTS.AGENT.LIST}?include_archived=${includeArchived}`
  );

  if (data.agents && data.agents.length > 0) {
    data.agents = data.agents.map((agent) => {
      if (
        agent.profile_picture_url &&
        !agent.profile_picture_url.startsWith("http")
      ) {
        agent.profile_picture_url = `${API_BASE_URL}${agent.profile_picture_url}`;
      }
      return agent;
    });
  }

  return data;
};

export const fetchAgentByUid = async (agentUid) => {
  const agent = await fetchAPI(ENDPOINTS.AGENT.GET(agentUid));

  if (
    agent.profile_picture_url &&
    !agent.profile_picture_url.startsWith("http")
  ) {
    agent.profile_picture_url = `${API_BASE_URL}${agent.profile_picture_url}`;
  }

  return agent;
};

export const createAgent = async (agentData) => {
  return await fetchAPI(ENDPOINTS.AGENT.CREATE, {
    method: "POST",
    body: JSON.stringify(agentData),
  });
};

export const updateAgent = async (agentUid, agentData) => {
  return await fetchAPI(ENDPOINTS.AGENT.UPDATE(agentUid), {
    method: "PUT",
    body: JSON.stringify(agentData),
  });
};

export const archiveAgent = async (agentUid) => {
  return await fetchAPI(ENDPOINTS.AGENT.DELETE(agentUid), {
    method: "DELETE",
  });
};

export const uploadProfilePicture = async (agentUid, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return await fetchAPI(`${ENDPOINTS.AGENT.GET(agentUid)}/profile-picture`, {
    method: "POST",
    body: formData,
  });
};

export const uploadCustomVoice = async (agentUid, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return await fetchAPI(`${ENDPOINTS.AGENT.GET(agentUid)}/custom-voice`, {
    method: "POST",
    body: formData,
  });
};
