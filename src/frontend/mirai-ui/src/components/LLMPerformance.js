import React, { useState } from "react";

const LLMPerformance = ({ onConfigChange }) => {
  const [wakeWordModel, setWakeWordModel] = useState("porcupine");
  const [wakeWordSensitivity, setWakeWordSensitivity] = useState(0.5);
  const [accessKey, setAccessKey] = useState("YOUR_ACCESS_KEY");
  const [leopardModelPublicPath, setLeopardModelPublicPath] = useState(
    "/model/leopard_params.pv"
  );

  const handleConfigChange = () => {
    onConfigChange({
      wakeWordModel,
      wakeWordSensitivity,
      leopardModelPublicPath,
      accessKey,
    });
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
          <input
            type="text"
            value={wakeWordModel}
            onChange={(e) => setWakeWordModel(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

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
          />
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
          <select className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Llama 2-7B</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Temperature</label>
          <input
            type="number"
            value={0.7}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Max Tokens</label>
          <input
            type="number"
            value={1000}
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
