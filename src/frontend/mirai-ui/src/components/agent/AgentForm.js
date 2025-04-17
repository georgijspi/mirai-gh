import React from "react";

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
          htmlFor="custom_voice_path"
        >
          Custom Voice Path
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="custom_voice_path"
          name="custom_voice_path"
          type="text"
          value={agentData.custom_voice_path}
          onChange={handleInputChange}
          placeholder="Path to custom voice file (optional)"
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional. Leave blank to use default voice.
        </p>
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
