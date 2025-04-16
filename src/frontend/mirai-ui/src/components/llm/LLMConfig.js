import React from "react";

const LLMConfig = () => {
  return (
    <div>
      <h4 className="text-xl font-bold mb-4 text-white">LLM Configuration</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2">Select Model</label>
          <select
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue="Llama 2-7B"
          >
            <option>Llama 2-7B</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Temperature</label>
          <input
            type="number"
            defaultValue={0.7}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Max Tokens</label>
          <input
            type="number"
            defaultValue={1000}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Personality Prompt</label>
          <textarea
            className="w-full p-2 bg-gray-700 text-white rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue="Your name is MirAI. You are a witty and funny assistant..."
          />
        </div>

        <div className="bg-gray-800 p-5 rounded-lg mt-6">
          <p className="text-gray-300">Performance Overview (Graph)</p>
        </div>
      </div>
    </div>
  );
};

export default LLMConfig;
