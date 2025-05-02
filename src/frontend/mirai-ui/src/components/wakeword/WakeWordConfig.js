import React from "react";

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

const WakeWordConfig = ({
  keywordModel,
  setKeywordModel,
  useCustomKeyword,
  setUseCustomKeyword,
  customKeywordModelPath,
  setCustomKeywordModelPath,
  customKeywordLabel,
  setCustomKeywordLabel,
  porcupineModelPublicPath,
  setPorcupineModelPublicPath,
}) => {
  return (
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
  );
};

export default WakeWordConfig;
