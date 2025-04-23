import React from "react";

const Sidebar = ({ setSelectedTab }) => {
  return (
    <>
      {/* Sidebar */}
      <aside className="top-0 left-0 z-40 h-screen w-64 bg-gray-900 text-white shadow-lg">
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-center mb-6">MirAI Admin</h2>
            <ul className="space-y-2 font-medium">
              <li>
                <button
                  onClick={() => setSelectedTab("Settings")}
                  className="flex items-center p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 group cursor-pointer w-full"
                >
                  <span className="ms-3">Settings</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedTab("APIModuleConfig")}
                  className="flex items-center p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 group cursor-pointer w-full"
                >
                  <span className="ms-3">API Module Configuration</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedTab("AgentConfiguration")}
                  className="flex items-center p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 group cursor-pointer w-full"
                >
                  <span className="ms-3">Agent Configuration</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedTab("GlobalChat")}
                  className="flex items-center p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 group cursor-pointer w-full"
                >
                  <span className="ms-3">Global Chat</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedTab("Conversations")}
                  className="flex items-center p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 group cursor-pointer w-full"
                >
                  <span className="ms-3">Conversations</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
