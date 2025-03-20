import React from "react";

const APIModuleConfig = () => {
  return (
    <div className="content">
      <h3>API Module Configuration</h3>
      <div className="api-module">
        <h4>Weather</h4>
        <input type="text" placeholder="API Key" />
        <input type="text" placeholder="API Endpoint" />
        <input type="text" placeholder="Sample Prompt" />
        <button>Configure</button>
      </div>
      <div className="api-module">
        <h4>News</h4>
        <input type="text" placeholder="API Key" />
        <input type="text" placeholder="API Endpoint" />
        <input type="text" placeholder="Sample Prompt" />
        <button>Configure</button>
      </div>
      <div className="api-module">
        <h4>Calendar</h4>
        <input type="text" placeholder="API Key" />
        <input type="text" placeholder="API Endpoint" />
        <input type="text" placeholder="Sample Prompt" />
        <button>Configure</button>
      </div>
    </div>
  );
};

export default APIModuleConfig;
