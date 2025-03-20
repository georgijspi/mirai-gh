import React from "react";

const LLMPerformance = () => {
  return (
    <div className="content">
      <h3>LLM Performance</h3>
      <label>Select Model</label>
      <select>
        <option>Llama 2-7B</option>
      </select>
      <label>Temperature</label>
      <input type="number" value={0.7} />
      <label>Max Tokens</label>
      <input type="number" value={1000} />
      <label>Personality Prompt</label>
      <textarea>
        Your name is MirAI. You are a witty and funny assistant...
      </textarea>
      <div className="chart-placeholder">Performance Overview (Graph)</div>
    </div>
  );
};

export default LLMPerformance;
