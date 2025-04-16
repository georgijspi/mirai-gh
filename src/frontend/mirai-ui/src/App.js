import "./tailwind.css";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatNow from "./components/ChatNow";
import APIModuleConfig from "./components/APIModuleConfig";
import LLMPerformance from "./components/LLMPerformance";
import TestUI from "./components/TestUI";

function App() {
  const [selectedTab, setSelectedTab] = useState("ChatNow");
  const [APITest, setAPITest] = useState(false);
  const [config, setConfig] = useState({
    keywordModel: "Alexa",
    leopardModelPublicPath: "/models/leopard_params.pv",
    porcupineModelPublicPath: "/models/porcupine_params.pv",
    accessKey: "",
    useCustomKeyword: false,
    customKeywordModelPath: "",
  });

  const handleConfigChange = (newConfig) => {
    console.log("Updating config:", newConfig);
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }));
  };

  return (
    <>
      {APITest && (
        <div className="w-full">
          <TestUI />
        </div>
      )}
      <div className="flex h-screen">
        <Sidebar
          setSelectedTab={setSelectedTab}
          APITest={APITest}
          setAPITest={setAPITest}
        />
        <div className="flex-1 bg-gray-800 overflow-auto">
          {selectedTab === "ChatNow" && <ChatNow config={config} />}
          {selectedTab === "LLMPerformance" && (
            <LLMPerformance
              onConfigChange={handleConfigChange}
              config={config}
            />
          )}
          {selectedTab === "APIModuleConfig" && <APIModuleConfig />}
        </div>
      </div>
    </>
  );
}

export default App;
