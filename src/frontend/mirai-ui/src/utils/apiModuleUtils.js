/**
 * Utility functions for API modules
 */

/**
 * Extracts variables from a query string based on a template pattern
 * Example: extractVariables("What's the weather in London?", "What's the weather in {city}?")
 * Returns: { city: "London" }
 * 
 * @param {string} query - The user's query
 * @param {string} template - The template with placeholders like {variable}
 * @returns {Object} - The extracted variables, or empty object if no match
 */
export const extractVariables = (query, template) => {
  if (!query || !template) {
    return {};
  }

  let pattern = template.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  const placeholders = [];
  const placeholderRegex = /{([^}]+)}/g;
  let match;
  
  while ((match = placeholderRegex.exec(template)) !== null) {
    placeholders.push(match[1]);
  }
  
  for (const placeholder of placeholders) {
    pattern = pattern.replace(`{${placeholder}}`, `([\\w\\s\\-\\.,]+)`);
  }
  
  const regex = new RegExp(`^${pattern}$`, 'i');
  const matches = query.match(regex);

  if (!matches) {
    return {};
  }

  const variables = {};
  for (let i = 0; i < placeholders.length; i++) {
    variables[placeholders[i]] = matches[i + 1]?.trim();
  }

  return variables;
};

/**
 * Formats a template string with variables
 * Example: formatTemplate("The weather in {city} is {weather}", { city: "London", weather: "cloudy" })
 * Returns: "The weather in London is cloudy"
 * 
 * @param {string} template - The template string with placeholders
 * @param {Object} variables - The variables to replace in the template
 * @returns {string} - The formatted string
 */
export const formatTemplate = (template, variables) => {
  if (!template) {
    return '';
  }
  
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  
  return result;
};

/**
 * Validates if a JSON string is valid
 * 
 * @param {string} jsonString - The JSON string to validate
 * @returns {boolean} - Whether the JSON is valid
 */
export const isValidJson = (jsonString) => {
  if (!jsonString) {
    return true;
  }
  
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Pretty formats a JSON string with proper indentation
 * 
 * @param {string} jsonString - The JSON string to format
 * @returns {string} - The formatted JSON string
 */
export const formatJson = (jsonString) => {
  if (!jsonString) {
    return '';
  }
  
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return jsonString;
  }
};

/**
 * Converts a JavaScript object to a URL query string
 * 
 * @param {Object} params - The parameters to convert
 * @returns {string} - The URL query string
 */
export const objectToQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

export default {
  extractVariables,
  formatTemplate,
  isValidJson,
  formatJson,
  objectToQueryString
}; 