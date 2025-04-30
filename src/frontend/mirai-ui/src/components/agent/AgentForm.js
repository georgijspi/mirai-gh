import React from "react";

// List of built-in keywords for Porcupine
const BUILT_IN_KEYWORDS = [
  "Alexa",
  "Americano",
  "Blueberry",
  "Bumblebee",
  "Computer",
  "Grapefruit",
  "Grasshopper",
  "Hey Google",
  "Hey Siri",
  "Jarvis",
  "Okay Google",
  "Picovoice",
  "Porcupine",
  "Terminator",
];

const AgentForm = ({
  agentData,
  isEditing,
  llmConfigs,
  llmConfigsLoading,
  handleInputChange,
  onSubmit,
  onCancel,
}) => {
  const formTitle = isEditing ? "Edit Agent" : "Create New Agent";
  const submitButtonText = isEditing ? "Save Changes" : "Create Agent";

  const handleWakewordTypeChange = (e) => {
    handleInputChange({
      target: {
        name: "wakeword_type",
        value: e.target.value,
      },
    });
  };

  const handleWakewordFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.pv')) {
        alert('Please upload a valid .pv wakeword model file');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size too large. Please upload a file smaller than 10MB');
        e.target.value = '';
        return;
      }
      handleInputChange({
        target: {
          name: "wakeword_model",
          value: file,
        },
      });
    }
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-xl font-bold mb-4">{formTitle}</h2>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="name"
        >
          Name
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="name"
          name="name"
          type="text"
          value={agentData.name}
          onChange={handleInputChange}
          placeholder="Agent Name"
          required
        />
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="personality_prompt"
        >
          Personality Prompt
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="personality_prompt"
          name="personality_prompt"
          value={agentData.personality_prompt}
          onChange={handleInputChange}
          placeholder="Describe the agent's personality, behavior, and knowledge"
          rows="4"
          required
        />
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="voice_speaker"
        >
          Voice Speaker
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="voice_speaker"
          name="voice_speaker"
          type="text"
          value={agentData.voice_speaker}
          onChange={handleInputChange}
          placeholder="Voice Speaker (e.g., morgan)"
          required
        />
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="llm_config_uid"
        >
          LLM Configuration
        </label>
        {llmConfigsLoading ? (
          <p>Loading LLM configurations...</p>
        ) : (
          <>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="llm_config_uid"
              name="llm_config_uid"
              value={agentData.llm_config_uid}
              onChange={handleInputChange}
              required
            >
              <option value="">Select an LLM Configuration</option>
              {llmConfigs && llmConfigs.length > 0 ? (
                llmConfigs.map((config) => (
                  <option key={config.config_uid} value={config.config_uid}>
                    {config.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No LLM configurations available
                </option>
              )}
            </select>
            <div className="mt-2 text-sm text-gray-500">
              {llmConfigs.length === 0 && !llmConfigsLoading && (
                <p>
                  No LLM configurations found. Please create one in the LLM
                  Configuration section.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="profile_picture"
        >
          Profile Picture
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="profile_picture"
          name="profile_picture"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleInputChange({
                target: {
                  name: "profile_picture",
                  value: file,
                },
              });
            }
          }}
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional. Upload a profile picture for the agent.
        </p>
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="custom_voice"
        >
          Custom Voice File
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="custom_voice"
          name="custom_voice"
          type="file"
          accept="audio/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleInputChange({
                target: {
                  name: "custom_voice",
                  value: file,
                },
              });
            }
          }}
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional. Upload a custom voice file for the agent.
        </p>
      </div>

      {/* Wakeword Configuration Section */}
      <div className="mb-6 border-t pt-4 mt-6">
        <h3 className="text-lg font-bold mb-4">Wakeword Configuration</h3>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Wakeword Type
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="wakeword_type"
                value="default"
                checked={agentData.wakeword_type === "default"}
                onChange={handleWakewordTypeChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Built-in Wakeword</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="wakeword_type"
                value="custom"
                checked={agentData.wakeword_type === "custom"}
                onChange={handleWakewordTypeChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Custom Wakeword</span>
            </label>
          </div>
        </div>

        {agentData.wakeword_type === "default" ? (
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="built_in_wakeword"
            >
              Built-in Wakeword
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="built_in_wakeword"
              name="built_in_wakeword"
              value={agentData.built_in_wakeword || BUILT_IN_KEYWORDS[0]}
              onChange={handleInputChange}
            >
              {BUILT_IN_KEYWORDS.map((keyword) => (
                <option key={keyword} value={keyword}>
                  {keyword}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="wakeword_model"
            >
              Custom Wakeword Model (.pv file)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="wakeword_model"
              name="wakeword_model"
              type="file"
              accept=".pv"
              onChange={handleWakewordFileChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              Upload a Picovoice (.pv) wakeword model file. Maximum size: 10MB
            </p>
          </div>
        )}

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="wakeword_sensitivity"
          >
            Wakeword Sensitivity ({agentData.wakeword_sensitivity || 0.5})
          </label>
          <input
            type="range"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            id="wakeword_sensitivity"
            name="wakeword_sensitivity"
            min="0"
            max="1"
            step="0.1"
            value={agentData.wakeword_sensitivity || 0.5}
            onChange={handleInputChange}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Less Sensitive</span>
            <span>More Sensitive</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={onSubmit}
        >
          {submitButtonText}
        </button>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AgentForm;
