import React, { useState, useEffect } from "react";
import WakeWordConfig from "../components/wakeword/WakeWordConfig";
import STTConfig from "../components/stt/STTConfig";
import LLMConfig from "../components/llm/LLMConfig";
import ModelManager from "../components/llm/ModelManager";
import Settings from "../components/Settings";

const SettingsPage = ({ onConfigChange, config }) => {
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
  const [activeTab, setActiveTab] = useState("voice");

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

  // Update global config when local state changes
  useEffect(() => {
    const storedAccessKey = localStorage.getItem('picovoice_access_key');
    if (storedAccessKey && storedAccessKey !== accessKey) {
      setAccessKey(storedAccessKey);
      
      // Also update the parent component's config
      const newConfig = {
        ...config,
        accessKey: storedAccessKey
      };
      onConfigChange(newConfig);
    }
  }, []);

  const handleConfigChange = () => {
    // Save to localStorage for persistence across app
    localStorage.setItem('picovoice_access_key', accessKey);
    
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
      <h3 className="text-2xl font-bold mb-6 text-white">Settings</h3>

      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("voice")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "voice"
                  ? "border-blue-500 text-white bg-blue-800"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Voice Settings
            </button>
            <button
              onClick={() => setActiveTab("access")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "access"
                  ? "border-blue-500 text-white bg-blue-800"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Access Keys
            </button>
            <button
              onClick={() => setActiveTab("llm")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "llm"
                  ? "border-blue-500 text-white bg-blue-800"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              LLM Configuration
            </button>
            <button
              onClick={() => setActiveTab("models")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "models"
                  ? "border-blue-500 text-white bg-blue-800"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Model Management
            </button>
          </nav>
        </div>
      </div>

      <div className={`space-y-8 ${activeTab === "models" ? "" : "max-w-md"}`}>
        {activeTab === "voice" && (
          <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <WakeWordConfig
                keywordModel={keywordModel}
                setKeywordModel={setKeywordModel}
                useCustomKeyword={useCustomKeyword}
                setUseCustomKeyword={setUseCustomKeyword}
                customKeywordModelPath={customKeywordModelPath}
                setCustomKeywordModelPath={setCustomKeywordModelPath}
                customKeywordLabel={customKeywordLabel}
                setCustomKeywordLabel={setCustomKeywordLabel}
                porcupineModelPublicPath={porcupineModelPublicPath}
                setPorcupineModelPublicPath={setPorcupineModelPublicPath}
              />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <STTConfig
                accessKey={accessKey}
                setAccessKey={setAccessKey}
              />
            </div>
          </div>
        )}

        {activeTab === "access" && <Settings />}

        {activeTab === "llm" && <LLMConfig />}

        {activeTab === "models" && <ModelManager />}

        {activeTab !== "llm" && activeTab !== "models" && activeTab !== "access" && (
          <button
            onClick={handleConfigChange}
            className="mt-6 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
          >
            Save Configuration
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
