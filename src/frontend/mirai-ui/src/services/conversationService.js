import { fetchAPI, ENDPOINTS } from "../config/api.config";

export const fetchConversations = async () => {
  return await fetchAPI(ENDPOINTS.CONVERSATION.LIST);
};

export const fetchConversationById = async (conversationId) => {
  return await fetchAPI(ENDPOINTS.CONVERSATION.GET(conversationId));
};

export const createConversation = async (agentUid) => {
  return await fetchAPI(ENDPOINTS.CONVERSATION.CREATE, {
    method: "POST",
    body: JSON.stringify({ agent_uid: agentUid }),
  });
};

export const updateConversation = async (conversationId, conversationData) => {
  return await fetchAPI(ENDPOINTS.CONVERSATION.UPDATE(conversationId), {
    method: "PUT",
    body: JSON.stringify(conversationData),
  });
};

export const deleteConversation = async (conversationId) => {
  return await fetchAPI(ENDPOINTS.CONVERSATION.DELETE(conversationId), {
    method: "DELETE",
  });
};

export const sendMessage = async (messageData) => {
  return await fetchAPI(ENDPOINTS.CONVERSATION.SEND_MESSAGE, {
    method: "POST",
    body: JSON.stringify(messageData),
  });
};

export const rateMessage = async (ratingData) => {
  return await fetchAPI(ENDPOINTS.CONVERSATION.RATE_MESSAGE, {
    method: "POST",
    body: JSON.stringify(ratingData),
  });
};
