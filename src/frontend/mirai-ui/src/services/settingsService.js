import { fetchAPI } from '../utils/apiUtils';

/**
 * Gets the Picovoice access key from the API
 * @returns {Promise<string>} The access key, or null if not found
 */
export const getPicovoiceAccessKey = async () => {
  try {
    const response = await fetchAPI('/settings/picovoice-access-key');
    return response;
  } catch (error) {
    console.error('Error fetching Picovoice access key:', error);
    return null;
  }
};

/**
 * Sets the Picovoice access key in the API
 * @param {string} accessKey The access key to set
 * @returns {Promise<Object>} The API response
 */
export const setPicovoiceAccessKey = async (accessKey) => {
  try {
    return await fetchAPI('/settings/picovoice-access-key', {
      method: 'POST',
      body: JSON.stringify({ access_key: accessKey }),
    });
  } catch (error) {
    console.error('Error setting Picovoice access key:', error);
    throw error;
  }
}; 