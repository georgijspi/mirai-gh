import React from "react";
import LLMPerformance from "../components/LLMPerformance";

const LLMPerformancePage = ({ config, onConfigChange }) => {
  return <LLMPerformance onConfigChange={onConfigChange} config={config} />;
};

export default LLMPerformancePage;
