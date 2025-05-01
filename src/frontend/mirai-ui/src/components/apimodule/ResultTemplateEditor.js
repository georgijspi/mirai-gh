import React from 'react';

const ResultTemplateEditor = ({ resultTemplate, setResultTemplate }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium">Result Template</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Define how the API response should be formatted for the user. Use curly braces to 
        reference values from the API response, e.g., {'{temperature}'} to display the temperature.
      </p>
      
      <textarea
        value={resultTemplate || ''}
        onChange={(e) => setResultTemplate(e.target.value)}
        rows={6}
        placeholder={`The weather in {location.name} is {current.weather[0].description} with a temperature of {current.temp}°C.`}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 font-mono text-sm rounded-md"
      />
      
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <h5 className="text-sm font-medium mb-1">Tips for result templates:</h5>
        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
          <li>Use curly braces to access properties from the API response JSON</li>
          <li>For nested properties, use dot notation: {'{weather.temperature}'}</li>
          <li>For arrays, use index notation: {'{forecast[0].temp}'}</li>
          <li>Combine fixed text with dynamic values from the response</li>
          <li>If left empty, the raw JSON response will be returned</li>
        </ul>
      </div>
      
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
        <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Example Template:</h5>
        <pre className="text-xs text-blue-600 dark:text-blue-400 overflow-x-auto">
          The weather in {'{location.name}'} is {'{current.weather[0].description}'} with a temperature of {'{current.temp}'}°C.
        </pre>
        <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-2 mb-1">Example Response:</h5>
        <pre className="text-xs text-blue-600 dark:text-blue-400 overflow-x-auto">
          The weather in London is cloudy with a temperature of 18°C.
        </pre>
      </div>
    </div>
  );
};

export default ResultTemplateEditor; 