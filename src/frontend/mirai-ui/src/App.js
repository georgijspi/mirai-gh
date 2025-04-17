import "./tailwind.css";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatNowPage from "./pages/ChatNowPage";
import APIModuleConfigPage from "./pages/APIModuleConfigPage";
import SettingsPage from "./pages/SettingsPage";
import TestUIPage from "./pages/TestUIPage";
import AgentConfigurationPage from "./pages/AgentConfigurationPage";

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
          <TestUIPage />
        </div>
      )}
      <div className="flex h-screen">
        <Sidebar
          setSelectedTab={setSelectedTab}
          APITest={APITest}
          setAPITest={setAPITest}
        />
        <div className="flex-1 bg-gray-800 overflow-auto">
          {selectedTab === "ChatNow" && <ChatNowPage config={config} />}
          {selectedTab === "Settings" && (
            <SettingsPage onConfigChange={handleConfigChange} config={config} />
          )}
          {selectedTab === "APIModuleConfig" && <APIModuleConfigPage />}
          {selectedTab === "AgentConfiguration" && <AgentConfigurationPage />}
        </div>
      </div>
    </>
  );
}

export default App;
