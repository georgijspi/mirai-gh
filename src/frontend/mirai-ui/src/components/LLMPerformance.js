import React, { useState, useEffect } from "react";

// List of built-in keywords for Porcupine
const builtInKeywords = ["Alexa","Americano","Blueberry","Bumblebee","Computer","Grapefruit","Grasshopper","Hey Google","Hey Siri","Jarvis","Okay Google","Picovoice","Porcupine","Terminator"];

const LLMPerformance = ({ onConfigChange, config }) => {
  const [wakeWordModel, setWakeWordModel] = useState(config.wakeWordModel || "Grapefruit");
  const [wakeWordSensitivity, setWakeWordSensitivity] = useState(config.wakeWordSensitivity || 0.5);
  const [accessKey, setAccessKey] = useState(config.accessKey || "");
  const [leopardModelPublicPath, setLeopardModelPublicPath] = useState(
    config.leopardModelPublicPath || "/models/leopard_params.pv"
  );

  // Update component state when config changes
  useEffect(() => {
    setWakeWordModel(config.wakeWordModel || "Grapefruit");
    setWakeWordSensitivity(config.wakeWordSensitivity || 0.5);
    setAccessKey(config.accessKey || "");
    setLeopardModelPublicPath(config.leopardModelPublicPath || "/models/leopard_params.pv");
  }, [config]);

  const handleConfigChange = () => {
    const newConfig = {
      wakeWordModel,
      wakeWordSensitivity,
      leopardModelPublicPath,
      accessKey,
    };
    console.log("Saving new config:", newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="flex-1 p-5">
      <h3 className="text-2xl font-bold mb-6 text-white">LLM Performance</h3>

      <div className="space-y-4 max-w-md">
        {/* Wake Word Configuration */}
        <div>
          <h4 className="text-xl font-bold mb-4 text-white">
            Wake Word Configuration
          </h4>
          <label className="block text-gray-300 mb-2">Wake Word Model</label>
          <select
            value={wakeWordModel}
            onChange={(e) => setWakeWordModel(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {builtInKeywords.map(keyword => (
              <option key={keyword} value={keyword}>{keyword}</option>
            ))}
          </select>

          <label className="block text-gray-300 mb-2 mt-4">
            Wake Word Sensitivity
          </label>
          <input
            type="number"
            value={wakeWordSensitivity}
            onChange={(e) => setWakeWordSensitivity(parseFloat(e.target.value))}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.1"
            min="0"
            max="1"
          />
        </div>

        {/* Speech-to-Text Configuration */}
        <div>
          <h4 className="text-xl font-bold mb-4 text-white">
            Speech-to-Text Configuration
          </h4>
          <label className="block text-gray-300 mb-2">
            Leopard Model Public Path
          </label>
          <input
            type="text"
            value={leopardModelPublicPath}
            onChange={(e) => setLeopardModelPublicPath(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Access Key Configuration */}
        <div>
          <h4 className="text-xl font-bold mb-4 text-white">Access Key</h4>
          <input
            type="text"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your Picovoice access key here"
          />
          <p className="text-gray-400 text-sm mt-1">
            Required for Leopard speech recognition. Get your key at <a href="https://console.picovoice.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">console.picovoice.ai</a>
          </p>
        </div>
        <button
          onClick={handleConfigChange}
          className="mt-6 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
        >
          Save Configuration
        </button>
        {/* LLM Configuration */}
        <div>
          <label className="block text-gray-300 mb-2">Select Model</label>
          <select 
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue="Llama 2-7B"
          >
            <option>Llama 2-7B</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Temperature</label>
          <input
            type="number"
            defaultValue={0.7}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Max Tokens</label>
          <input
            type="number"
            defaultValue={1000}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Personality Prompt</label>
          <textarea
            className="w-full p-2 bg-gray-700 text-white rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue="Your name is MirAI. You are a witty and funny assistant..."
          />
        </div>

        <div className="bg-gray-800 p-5 rounded-lg mt-6">
          <p className="text-gray-300">Performance Overview (Graph)</p>
        </div>
      </div>
    </div>
  );
};

export default LLMPerformance;
