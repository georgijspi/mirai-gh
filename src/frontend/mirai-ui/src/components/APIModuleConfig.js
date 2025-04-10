import React, { useState } from "react";

const APIModuleConfig = () => {
  const [modules, setModules] = useState([
    { name: "Weather", apiKey: "", endpoint: "", prompt: "" },
    { name: "News", apiKey: "", endpoint: "", prompt: "" },
    { name: "Calendar", apiKey: "", endpoint: "", prompt: "" },
  ]);

  const addModule = () => {
    setModules([
      ...modules,
      { name: "New Module", apiKey: "", endpoint: "", prompt: "" },
    ]);
  };

  const updateModule = (index, field, value) => {
    const updatedModules = [...modules];
    updatedModules[index][field] = value;
    setModules(updatedModules);
    localStorage.setItem("apiModules", JSON.stringify(updatedModules));
  };

  const removeModule = (index) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    setModules(updatedModules);
    localStorage.setItem("apiModules", JSON.stringify(updatedModules));
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        API Module Configuration
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-4"
          >
            <input
              type="text"
              value={module.name}
              onChange={(e) => updateModule(index, "name", e.target.value)}
              placeholder="Module Name"
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={module.apiKey}
              onChange={(e) => updateModule(index, "apiKey", e.target.value)}
              placeholder="API Key"
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={module.endpoint}
              onChange={(e) => updateModule(index, "endpoint", e.target.value)}
              placeholder="API Endpoint"
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={module.prompt}
              onChange={(e) => updateModule(index, "prompt", e.target.value)}
              placeholder="Sample Prompt"
              className="w-full p-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeModule(index)}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition mb-2"
            >
              Remove
            </button>
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition">
              Save
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addModule}
        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition mt-6"
      >
        Add New API Module
      </button>
    </div>
  );
};

export default APIModuleConfig;
