import React from "react";
import { useState } from "react";

const Sidebar = ({
  setSelectedTab,
  APITest,
  setAPITest,
  darkMode,
  setDarkMode,
}) => {
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
      <button
        className="dark-mode-toggle"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
      <button className="api-test-toggle" onClick={() => setAPITest(!APITest)}>
        {APITest ? "Hide API Test" : "Show API Test"}
      </button>
    </div>
  );
};

export default Sidebar;
