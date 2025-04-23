import "./tailwind.css";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatNowPage from "./pages/GlobalChatPage";
import APIModuleConfigPage from "./pages/APIModuleConfigPage";
import SettingsPage from "./pages/SettingsPage";
import AgentConfigurationPage from "./pages/AgentConfigurationPage";
import ConversationsPage from "./pages/ConversationsPage";

function App() {
  const [selectedTab, setSelectedTab] = useState("Conversations");
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
      <div className="flex h-screen">
        <Sidebar setSelectedTab={setSelectedTab} />
        <div className="flex-1 bg-gray-800 overflow-auto">
          {selectedTab === "ChatNow" && <ChatNowPage config={config} />}
          {selectedTab === "Settings" && (
            <SettingsPage onConfigChange={handleConfigChange} config={config} />
          )}
          {selectedTab === "APIModuleConfig" && <APIModuleConfigPage />}
          {selectedTab === "AgentConfiguration" && <AgentConfigurationPage />}
          {selectedTab === "Conversations" && <ConversationsPage />}
        </div>
      </div>
    </>
  );
}

export default App;
