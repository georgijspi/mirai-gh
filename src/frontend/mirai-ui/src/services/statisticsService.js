import { API_BASE_URL } from "../config/apiConfig";

// Get message statistics (likes, dislikes, total)
export const getMessageStatistics = async (llmFilter = null, agentFilter = null) => {
  let url = `${API_BASE_URL}/statistics/messages`;
  
  // Add query parameters if filters are provided
  const params = new URLSearchParams();
  if (llmFilter) params.append('llm_filter', llmFilter);
  if (agentFilter) params.append('agent_filter', agentFilter);
  
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch message statistics');
  }
  
  return response.json();
};

// Get response metrics (response time, audio duration, character count)
export const getResponseMetrics = async () => {
  const url = `${API_BASE_URL}/statistics/metrics`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch response metrics');
  }
  
  return response.json();
};

// Get LLM performance statistics
export const getLlmStatistics = async (llmFilter = null) => {
  let url = `${API_BASE_URL}/statistics/llm`;
  
  // Add query parameter if filter is provided
  if (llmFilter) {
    url += `?llm_filter=${llmFilter}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch LLM statistics');
  }
  
  return response.json();
};

// Get agent performance statistics
export const getAgentStatistics = async (agentFilter = null) => {
  let url = `${API_BASE_URL}/statistics/agent`;
  
  // Add query parameter if filter is provided
  if (agentFilter) {
    url += `?agent_filter=${agentFilter}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch agent statistics');
  }
  
  return response.json();
}; 