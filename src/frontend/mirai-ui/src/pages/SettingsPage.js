import React, { useState, useEffect } from "react";
import WakeWordConfig from "../components/wakeword/WakeWordConfig";
import STTConfig from "../components/stt/STTConfig";
import LLMConfig from "../components/llm/LLMConfig";

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
      <h3 className="text-2xl font-bold mb-6 text-white">Settings</h3>

      <div className="space-y-8 max-w-md">
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

        <STTConfig
          leopardModelPublicPath={leopardModelPublicPath}
          setLeopardModelPublicPath={setLeopardModelPublicPath}
          accessKey={accessKey}
          setAccessKey={setAccessKey}
        />

        <button
          onClick={handleConfigChange}
          className="mt-6 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
        >
          Save Configuration
        </button>

        <LLMConfig />
      </div>
    </div>
  );
};

export default SettingsPage;
