import React, { useState, useEffect } from "react";

// List of built-in keywords for Porcupine
const builtInKeywords = [
  "Alexa",
  "Americano",
  "Blueberry",
  "Bumblebee",
  "Computer",
  "Grapefruit",
  "Grasshopper",
  "Hey Google",
  "Hey Siri",
  "Jarvis",
  "Okay Google",
  "Picovoice",
  "Porcupine",
  "Terminator",
];

const LLMPerformance = ({ onConfigChange, config }) => {
  const [keywordModel, setKeywordModel] = useState(
    config.keywordModel || "Alexa"
  );
  const [accessKey, setAccessKey] = useState(config.accessKey || "");
  const [leopardModelPublicPath, setLeopardModelPublicPath] = useState(
    config.leopardModelPublicPath || "/models/leopard_params.pv"
  );
  const [porcupineModelPublicPath, setPorcupineModelPublicPath] = useState(
    config.porcupineModelPublicPath || "/models/porcupine_params.pv"
  );
  const [customKeywordModelPath, setCustomKeywordModelPath] = useState(
    config.customKeywordModelPath || ""
  );
  const [customKeywordLabel, setCustomKeywordLabel] = useState(
    config.customKeywordLabel || "Custom Keyword"
  );
  const [useCustomKeyword, setUseCustomKeyword] = useState(
    config.useCustomKeyword || false
  );

  // Update component state when config changes
  useEffect(() => {
    setKeywordModel(config.keywordModel || "Alexa");
    setAccessKey(config.accessKey || "");
    setLeopardModelPublicPath(
      config.leopardModelPublicPath || "/models/leopard_params.pv"
    );
    setPorcupineModelPublicPath(
      config.porcupineModelPublicPath || "/models/porcupine_params.pv"
    );
    setCustomKeywordModelPath(config.customKeywordModelPath || "");
    setCustomKeywordLabel(config.customKeywordLabel || "Custom Keyword");
    setUseCustomKeyword(config.useCustomKeyword || false);
  }, [config]);

  const handleConfigChange = () => {
    const newConfig = {
      keywordModel,
      leopardModelPublicPath,
      porcupineModelPublicPath,
      accessKey,
      customKeywordModelPath,
      customKeywordLabel,
      useCustomKeyword,
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

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">
                Built-in Wake Word Model
              </label>
              <select
                value={keywordModel}
                onChange={(e) => setKeywordModel(e.target.value)}
                className={`w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  useCustomKeyword ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={useCustomKeyword}
              >
                {builtInKeywords.map((keyword) => (
                  <option key={keyword} value={keyword}>
                    {keyword}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">
                Custom Keyword Model Path
              </label>
              <input
                type="text"
                value={customKeywordModelPath}
                onChange={(e) => setCustomKeywordModelPath(e.target.value)}
                className={`w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !useCustomKeyword ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder="Path to your custom keyword model"
                disabled={!useCustomKeyword}
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">
                Custom Keyword Label
              </label>
              <input
                type="text"
                value={customKeywordLabel}
                onChange={(e) => setCustomKeywordLabel(e.target.value)}
                className={`w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !useCustomKeyword ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder="Label for your custom keyword"
                disabled={!useCustomKeyword}
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center text-gray-300">
                <input
                  type="checkbox"
                  checked={useCustomKeyword}
                  onChange={(e) => setUseCustomKeyword(e.target.checked)}
                  className="mr-2"
                />
                Use Custom Keyword Model
              </label>
            </div>
          </div>

          <label className="block text-gray-300 mb-2 mt-4">
            Porcupine Model Public Path
          </label>
          <input
            type="text"
            value={porcupineModelPublicPath}
            onChange={(e) => setPorcupineModelPublicPath(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            Required for Leopard speech recognition. Get your key at{" "}
            <a
              href="https://console.picovoice.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              console.picovoice.ai
            </a>
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
