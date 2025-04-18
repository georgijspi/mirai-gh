const API_BASE_URL = "http://localhost:8005/mirai/api";

/**
 * Fetch all agents
 * @param {boolean} includeArchived - Whether to include archived agents
 * @returns {Promise<Object>} - Response containing list of agents
 */
export const fetchAgents = async (includeArchived = false) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/agent/list?include_archived=${includeArchived}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch agents");
    }
    
    const data = await response.json();
    
    // Ensure profile_picture_url is the full URL
    if (data.agents && data.agents.length > 0) {
      data.agents = data.agents.map(agent => {
        // If there's a profile_picture_url but it's a relative path, make it absolute
        if (agent.profile_picture_url && !agent.profile_picture_url.startsWith('http')) {
          agent.profile_picture_url = `${API_BASE_URL}${agent.profile_picture_url}`;
        }
        return agent;
      });
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching agents:", error);
    throw error;
  }
};

/**
 * Fetch a specific agent by UID
 * @param {string} agentUid - The unique identifier of the agent
 * @returns {Promise<Object>} - The agent data
 */
export const fetchAgentByUid = async (agentUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/${agentUid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch agent");
    }
    
    const agent = await response.json();
    
    // Ensure profile_picture_url is the full URL
    if (agent.profile_picture_url && !agent.profile_picture_url.startsWith('http')) {
      agent.profile_picture_url = `${API_BASE_URL}${agent.profile_picture_url}`;
    }
    
    return agent;
  } catch (error) {
    console.error("Error fetching agent:", error);
    throw error;
  }
};

/**
 * Create a new agent
 * @param {Object} agentData - The agent data to create
 * @returns {Promise<Object>} - The created agent data
 */
export const createAgent = async (agentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agentData),
    });
    if (!response.ok) {
      throw new Error("Failed to create agent");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
};

/**
 * Update an existing agent
 * @param {string} agentUid - The unique identifier of the agent
 * @param {Object} agentData - The agent data to update
 * @returns {Promise<Object>} - The updated agent data
 */
export const updateAgent = async (agentUid, agentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/${agentUid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agentData),
    });
    if (!response.ok) {
      throw new Error("Failed to update agent");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating agent:", error);
    throw error;
  }
};

/**
 * Archive (soft delete) an agent
 * @param {string} agentUid - The unique identifier of the agent
 * @returns {Promise<Object>} - Status response
 */
export const archiveAgent = async (agentUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/${agentUid}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to archive agent");
    }
    return await response.json();
  } catch (error) {
    console.error("Error archiving agent:", error);
    throw error;
  }
};

/**
 * Upload a profile picture for an agent
 * @param {string} agentUid - The unique identifier of the agent
 * @param {File} file - The profile picture file to upload
 * @returns {Promise<Object>} - Response containing the upload status
 */
export const uploadProfilePicture = async (agentUid, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE_URL}/agent/${agentUid}/profile-picture`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload profile picture");
    }
    return await response.json();
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

/**
 * Upload a custom voice file for an agent
 * @param {string} agentUid - The unique identifier of the agent
 * @param {File} file - The custom voice file to upload
 * @returns {Promise<Object>} - Response containing the upload status
 */
export const uploadCustomVoice = async (agentUid, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE_URL}/agent/${agentUid}/custom-voice`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload custom voice file");
    }
    return await response.json();
  } catch (error) {
    console.error("Error uploading custom voice file:", error);
    throw error;
  }
};
