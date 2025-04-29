import "./tailwind.css";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import GlobalChatPage from "./pages/GlobalChatPage";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleConfigChange = (newConfig) => {
    console.log("Updating config:", newConfig);
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />

      <div className="flex h-screen overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-700 rounded-md text-white shadow-lg"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>

        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:static z-40 transition-transform duration-300 ease-in-out`}
        >
          <Sidebar setSelectedTab={handleTabSelect} />
        </div>

        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <div className="flex-1 bg-gray-800 overflow-auto md:ml-0 pt-16 md:pt-0">
          {selectedTab === "Settings" && (
            <SettingsPage onConfigChange={handleConfigChange} config={config} />
          )}
          {selectedTab === "APIModuleConfig" && <APIModuleConfigPage />}
          {selectedTab === "AgentConfiguration" && <AgentConfigurationPage />}
          {selectedTab === "Conversations" && <ConversationsPage />}
          {selectedTab === "GlobalChat" && <GlobalChatPage config={config} />}
        </div>
      </div>
    </>
  );
}

export default App;
