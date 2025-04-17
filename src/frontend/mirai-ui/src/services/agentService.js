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
    return await response.json();
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
    return await response.json();
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
