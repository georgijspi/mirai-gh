import { fetchAPI, ENDPOINTS } from "../config/api.config";

export async function fetchGlobalConversation() {
  return fetchAPI(ENDPOINTS.GLOBAL_CONVERSATION.GET, { method: "GET" });
}

export async function sendGlobalMessage(content) {
  return fetchAPI(ENDPOINTS.GLOBAL_CONVERSATION.SEND_MESSAGE, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function rateGlobalMessage(message_uid, rating) {
  return fetchAPI(ENDPOINTS.GLOBAL_CONVERSATION.RATE_MESSAGE, {
    method: "POST",
    body: JSON.stringify({ message_uid, rating }),
  });
}
