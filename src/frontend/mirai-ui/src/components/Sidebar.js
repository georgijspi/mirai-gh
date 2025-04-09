import React from "react";

const Sidebar = ({ setSelectedTab, APITest, setAPITest }) => {
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
                  onClick={() => setSelectedTab("LLMPerformance")}
                  className="flex items-center p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 group cursor-pointer w-full"
                >
                  <span className="ms-3">LLM Performance</span>
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
                  onClick={() => setSelectedTab("ChatNow")}
                  className="flex items-center p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 group cursor-pointer w-full"
                >
                  <span className="ms-3">Chat Now</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4 px-2 pb-4">
            <button
              className="w-full py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              onClick={() => setAPITest(!APITest)}
            >
              {APITest ? "Hide API Test" : "Show API Test"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
