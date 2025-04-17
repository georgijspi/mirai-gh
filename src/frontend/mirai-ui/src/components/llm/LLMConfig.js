import React, { useState, useEffect } from "react";
import {
  fetchLLMConfigs,
  deleteLLMConfig,
  updateLLMConfig,
  createLLMConfig,
  fetchAvailableModels,
  fetchLLMConfigByUid,
} from "../../services/llmService";

const defaultConfig = {
  name: "",
  model: "",
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  repeat_penalty: 1.1,
  max_tokens: 4096,
  presence_penalty: 0,
  frequency_penalty: 0,
  stop_sequences: [],
  additional_params: {},
  tts_instructions:
    'When responding, please follow these guidelines for better voice readability:\n1. Do not include parenthetical expressions like (smiles), (laughs), (pauses) in your text.\n2. Express emotions through your words rather than through stage directions.\n3. Use natural language patterns that flow well when read aloud.\n4. Avoid special formatting that might be difficult to interpret in speech.\n5. If you want to express actions or emotions, incorporate them into the text naturally.\nFor example, instead of "(laughs) That\'s funny", say "Haha, that\'s funny" or "That makes me laugh."',
  is_archived: false,
};

const LLMConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newConfig, setNewConfig] = useState(defaultConfig);
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    loadConfigs();
    loadAvailableModels();
  }, [includeArchived]);

  const loadAvailableModels = async () => {
    try {
      setModelsLoading(true);
      const models = await fetchAvailableModels();
      setAvailableModels(models);
    } catch (err) {
      console.error("Failed to load available models:", err);
    } finally {
      setModelsLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLLMConfigs(includeArchived);
      setConfigs(data);
      if (data.length > 0 && !selectedConfig) {
        setSelectedConfig(data[0]);
      }
    } catch (err) {
      setError("Failed to load LLM configurations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedConfig) return;

    try {
      setLoading(true);
      await deleteLLMConfig(selectedConfig.config_uid);
      setMessage("Configuration deleted successfully");
      await loadConfigs();
      setSelectedConfig(null);
    } catch (err) {
      setError("Failed to delete configuration");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!selectedConfig) return;
    setEditedConfig({ ...selectedConfig });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedConfig) return;

    try {
      setLoading(true);
      await updateLLMConfig(editedConfig.config_uid, editedConfig);
      setMessage("Configuration updated successfully");

      // Fetch the updated config directly by its UID
      const updatedConfig = await fetchLLMConfigByUid(editedConfig.config_uid);
      setSelectedConfig(updatedConfig);

      // Also update the configs list to keep it in sync
      const updatedConfigs = await fetchLLMConfigs(includeArchived);
      setConfigs(updatedConfigs);

      setIsEditing(false);
      setEditedConfig(null);
    } catch (err) {
      setError("Failed to update configuration");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedConfig(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setNewConfig(defaultConfig);
  };

  const handleSaveNew = async () => {
    try {
      setLoading(true);
      const response = await createLLMConfig(newConfig);
      setMessage("Configuration created successfully");

      // Fetch the newly created config directly by its UID
      const createdConfig = await fetchLLMConfigByUid(response.config_uid);
      setSelectedConfig(createdConfig);

      // Also update the configs list to keep it in sync
      const updatedConfigs = await fetchLLMConfigs(includeArchived);
      setConfigs(updatedConfigs);

      setIsCreating(false);
      setNewConfig(defaultConfig);
    } catch (err) {
      setError("Failed to create configuration");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewConfig(defaultConfig);
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else if (editedConfig) {
      setEditedConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
        <button
          onClick={loadConfigs}
          className="ml-4 text-blue-500 hover:text-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderConfigForm = (config, isNew = false) => (
    <>
      <div>
        <label className="block text-gray-300 mb-2">Name</label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-gray-300 mb-2">Model</label>
        {modelsLoading ? (
          <div className="animate-pulse h-10 bg-gray-700 rounded-md"></div>
        ) : (
          <select
            value={config.model}
            onChange={(e) => handleInputChange("model", e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a model</option>
            {availableModels.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-gray-300 mb-2">Temperature</label>
        <input
          type="number"
          value={config.temperature}
          onChange={(e) =>
            handleInputChange("temperature", parseFloat(e.target.value))
          }
          className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-gray-300 mb-2">Max Tokens</label>
        <input
          type="number"
          value={config.max_tokens}
          onChange={(e) =>
            handleInputChange("max_tokens", parseInt(e.target.value))
          }
          className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-gray-300 mb-2">TTS Instructions</label>
        <textarea
          value={config.tts_instructions}
          onChange={(e) =>
            handleInputChange("tts_instructions", e.target.value)
          }
          className="w-full p-2 bg-gray-700 text-white rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 mb-2">Top P</label>
          <input
            type="number"
            value={config.top_p}
            onChange={(e) =>
              handleInputChange("top_p", parseFloat(e.target.value))
            }
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Top K</label>
          <input
            type="number"
            value={config.top_k}
            onChange={(e) =>
              handleInputChange("top_k", parseInt(e.target.value))
            }
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Repeat Penalty</label>
          <input
            type="number"
            value={config.repeat_penalty}
            onChange={(e) =>
              handleInputChange("repeat_penalty", parseFloat(e.target.value))
            }
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Presence Penalty</label>
          <input
            type="number"
            value={config.presence_penalty}
            onChange={(e) =>
              handleInputChange("presence_penalty", parseFloat(e.target.value))
            }
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Frequency Penalty</label>
          <input
            type="number"
            value={config.frequency_penalty}
            onChange={(e) =>
              handleInputChange("frequency_penalty", parseFloat(e.target.value))
            }
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  );

  return (
    <div>
      <h4 className="text-xl font-bold mb-4 text-white">LLM Configuration</h4>
      {message && (
        <div className="mb-4 p-4 bg-green-500 text-white rounded-md">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="ml-4 text-white hover:text-gray-200"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="mr-2"
            />
            Include Archived Configurations
          </label>
          <button
            onClick={loadConfigs}
            className="text-white hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {!isCreating && (
          <div>
            <label className="block text-gray-300 mb-2">
              Select Configuration
            </label>
            <select
              value={selectedConfig?.config_uid || ""}
              onChange={(e) => {
                const config = configs.find(
                  (c) => c.config_uid === e.target.value
                );
                setSelectedConfig(config);
                setIsEditing(false);
                setEditedConfig(null);
              }}
              className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {configs.map((config) => (
                <option key={config.config_uid} value={config.config_uid}>
                  {config.name} {config.is_archived ? "(Archived)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {isCreating ? (
          <>
            <h5 className="text-lg font-semibold text-white mb-4">
              Create New Configuration
            </h5>
            {renderConfigForm(newConfig, true)}
            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleSaveNew}
                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
              >
                Create
              </button>
              <button
                onClick={handleCancelCreate}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : selectedConfig ? (
          <>
            {isEditing ? (
              <>
                {renderConfigForm(editedConfig)}
                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={handleSave}
                    className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {renderConfigForm(selectedConfig)}
                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={handleEdit}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </>
        ) : null}

        {!isCreating && (
          <button
            onClick={handleCreate}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
          >
            Create New Configuration
          </button>
        )}

        <div className="bg-gray-800 p-5 rounded-lg mt-6">
          <p className="text-gray-300">Performance Overview (Graph)</p>
        </div>
      </div>
    </div>
  );
};

export default LLMConfig;
