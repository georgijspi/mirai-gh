import { API_BASE_URL } from '../config/api.config';

/**
 * Helper function to call the API endpoints
 * @param {string} endpoint - The API endpoint to call (without the base URL)
 * @param {Object} options - Fetch options (method, headers, body)
 * @returns {Promise<any>} - The API response
 */
export const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const fetchOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || `API error: ${response.status} ${response.statusText}`);
    }

    // Check if the response is empty (204 No Content)
    if (response.status === 204) {
      return null;
    }

    // For non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      return text || null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}; 