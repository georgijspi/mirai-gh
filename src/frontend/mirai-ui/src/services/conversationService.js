const API_BASE_URL = "http://localhost:8005/mirai/api";

/**
 * Fetch all conversations for the current user
 * @returns {Promise<Object>} - Response containing list of conversations
 */
export const fetchConversations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

/**
 * Fetch a specific conversation by ID
 * @param {string} conversationId - The unique identifier of the conversation
 * @returns {Promise<Object>} - The conversation data
 */
export const fetchConversationById = async (conversationId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/conversation/${conversationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch conversation");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

/**
 * Create a new conversation with a specific agent
 * @param {string} agentUid - The unique identifier of the agent
 * @returns {Promise<Object>} - The created conversation data
 */
export const createConversation = async (agentUid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_uid: agentUid }),
    });
    if (!response.ok) {
      throw new Error("Failed to create conversation");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * Update an existing conversation
 * @param {string} conversationId - The unique identifier of the conversation
 * @param {Object} conversationData - The conversation data to update
 * @returns {Promise<Object>} - The updated conversation data
 */
export const updateConversation = async (conversationId, conversationData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/conversation/${conversationId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conversationData),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update conversation");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating conversation:", error);
    throw error;
  }
};

/**
 * Delete a conversation
 * @param {string} conversationId - The unique identifier of the conversation
 * @returns {Promise<Object>} - Status response
 */
export const deleteConversation = async (conversationId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/conversation/${conversationId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete conversation");
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

/**
 * Send a message in a conversation
 * @param {Object} messageData - The message data to send
 * @returns {Promise<Object>} - Response containing the sent message
 */
export const sendMessage = async (messageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation/send_message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });
    if (!response.ok) {
      throw new Error("Failed to send message");
    }
    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Rate a message in a conversation
 * @param {Object} ratingData - The rating data
 * @returns {Promise<Object>} - Response containing the rating status
 */
export const rateMessage = async (ratingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation/rate_message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ratingData),
    });
    if (!response.ok) {
      throw new Error("Failed to rate message");
    }
    return await response.json();
  } catch (error) {
    console.error("Error rating message:", error);
    throw error;
  }
};
