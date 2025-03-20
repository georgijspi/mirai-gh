import React from "react";

const Sidebar = ({ setSelectedTab }) => {
  return (
    <div className="sidebar">
      <h2>MirAI Admin</h2>
      <ul>
        <li onClick={() => setSelectedTab("LLMPerformance")}>
          LLM Performance
        </li>
        <li onClick={() => setSelectedTab("APIModuleConfig")}>
          API Module Configuration
        </li>
        <li onClick={() => setSelectedTab("ChatNow")}>Chat Now</li>
      </ul>
    </div>
  );
};

export default Sidebar;
