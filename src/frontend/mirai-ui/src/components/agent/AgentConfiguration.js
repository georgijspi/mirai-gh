import React, { useState, useEffect } from "react";
import {
  fetchAgents,
  createAgent,
  archiveAgent,
  updateAgent,
  fetchAgentByUid,
  uploadProfilePicture,
  uploadCustomVoice,
} from "../../services/agentService";
import { fetchLLMConfigs } from "../../services/llmService";
import AgentForm from "./AgentForm";

// Add API_BASE_URL import
const API_BASE_URL = "http://localhost:8005/mirai/api";

const AgentConfiguration = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [llmConfigsLoading, setLlmConfigsLoading] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [newAgent, setNewAgent] = useState({
    name: "",
    personality_prompt: "",
    voice_speaker: "",
    llm_config_uid: "",
    profile_picture: null,
    custom_voice: null,
    is_archived: false,
  });

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await fetchAgents(false);
      console.log("Loaded agents data:", data);

      // Log agent picture information
      if (data.agents && data.agents.length > 0) {
        data.agents.forEach((agent) => {
          console.log(`Agent ${agent.name} (${agent.agent_uid}):`, {
            profile_picture_path: agent.profile_picture_path,
            profile_picture_url: agent.profile_picture_url,
          });
        });
      }

      setAgents(data.agents || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError("Failed to load agents. Please try again later.");
      setLoading(false);
    }
  };

  const loadLlmConfigs = async () => {
    if (llmConfigsLoading) return;
    try {
      setLlmConfigsLoading(true);
      const configs = await fetchLLMConfigs(false);
      setLlmConfigs(configs || []);
    } catch (err) {
      console.error("Error fetching LLM configurations:", err);
      setError("Failed to load LLM configurations. Please try again later.");
    } finally {
      setLlmConfigsLoading(false);
    }
  };

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Determine which state to update based on whether we're editing or creating
    if (editingAgent) {
      // We're editing an existing agent
      setEditingAgent((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    } else {
      // We're creating a new agent
      setNewAgent((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Add a new agent
  const addAgent = async () => {
    try {
      if (
        !newAgent.name ||
        !newAgent.personality_prompt ||
        !newAgent.llm_config_uid
      ) {
        setError(
          "Name, personality prompt, and LLM configuration are required."
        );
        return;
      }

      // Create the agent first
      const agentData = { ...newAgent };
      delete agentData.profile_picture;
      delete agentData.custom_voice;
      const data = await createAgent(agentData);

      // If there's a profile picture, upload it
      if (newAgent.profile_picture) {
        try {
          await uploadProfilePicture(data.agent_uid, newAgent.profile_picture);
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
        }
      }

      // If there's a custom voice file, upload it
      if (newAgent.custom_voice) {
        try {
          await uploadCustomVoice(data.agent_uid, newAgent.custom_voice);
        } catch (uploadError) {
          console.error("Error uploading custom voice file:", uploadError);
        }
      }

      await loadAgents();

      setNewAgent({
        name: "",
        personality_prompt: "",
        voice_speaker: "",
        llm_config_uid: "",
        profile_picture: null,
        custom_voice: null,
        is_archived: false,
      });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("Error adding agent:", err);
      setError("Failed to add agent. Please try again.");
    }
  };

  // Start editing an agent
  const startEditingAgent = async (agentUid) => {
    try {
      const agent = await fetchAgentByUid(agentUid);
      loadLlmConfigs();
      setEditingAgent(agent);
      setShowAddForm(false);
    } catch (err) {
      console.error("Error fetching agent details:", err);
      setError("Failed to load agent details. Please try again.");
    }
  };

  // Save edited agent
  const saveEditedAgent = async () => {
    try {
      if (
        !editingAgent.name ||
        !editingAgent.personality_prompt ||
        !editingAgent.llm_config_uid
      ) {
        setError(
          "Name, personality prompt, and LLM configuration are required."
        );
        return;
      }

      // Update the agent first
      const agentData = { ...editingAgent };
      delete agentData.profile_picture;
      delete agentData.custom_voice;
      await updateAgent(editingAgent.agent_uid, agentData);

      // If there's a new profile picture, upload it
      if (editingAgent.profile_picture) {
        try {
          await uploadProfilePicture(
            editingAgent.agent_uid,
            editingAgent.profile_picture
          );
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
        }
      }

      // If there's a new custom voice file, upload it
      if (editingAgent.custom_voice) {
        try {
          await uploadCustomVoice(
            editingAgent.agent_uid,
            editingAgent.custom_voice
          );
        } catch (uploadError) {
          console.error("Error uploading custom voice file:", uploadError);
        }
      }

      // Refetch the latest agents instead of updating local state
      await loadAgents();

      setEditingAgent(null);
      setError(null);
    } catch (err) {
      console.error("Error updating agent:", err);
      setError("Failed to update agent. Please try again.");
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingAgent(null);
  };

  // Delete an agent
  const deleteAgent = async (agentUid) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        await archiveAgent(agentUid);
        await loadAgents();
      } catch (err) {
        console.error("Error deleting agent:", err);
        setError("Failed to delete agent. Please try again.");
      }
    }
  };

  // Fetch agents from the API
  useEffect(() => {
    loadAgents();
  }, []);

  // Toggle the add form
  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    loadLlmConfigs();
    setEditingAgent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
          Agent Configuration
        </h1>
        <button
          onClick={toggleAddForm}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {showAddForm ? "Cancel" : "Add New Agent"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showAddForm && (
        <AgentForm
          agentData={newAgent}
          isEditing={false}
          llmConfigs={llmConfigs}
          llmConfigsLoading={llmConfigsLoading}
          handleInputChange={handleInputChange}
          onSubmit={addAgent}
          onCancel={toggleAddForm}
        />
      )}

      {editingAgent && (
        <AgentForm
          agentData={editingAgent}
          isEditing={true}
          llmConfigs={llmConfigs}
          llmConfigsLoading={llmConfigsLoading}
          handleInputChange={handleInputChange}
          onSubmit={saveEditedAgent}
          onCancel={cancelEditing}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {agents.map((agent) => (
          <div
            key={agent.agent_uid}
            className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300"
          >
            {/* Profile picture section */}
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
              {agent.profile_picture_url ? (
                <div className="w-32 h-32 rounded-3xl overflow-hidden flex items-center justify-center bg-blue-500">
                  <img
                    src={agent.profile_picture_url}
                    alt={`${agent.name}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(
                        `Failed to load image from ${agent.profile_picture_url}`
                      );
                      e.target.onerror = null;
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect x='10' y='10' width='80' height='80' rx='20' fill='%234299e1'/%3E%3Ctext x='50' y='65' font-family='Arial' font-size='50' fill='white' text-anchor='middle'%3E" +
                        agent.name.charAt(0).toUpperCase() +
                        "%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              ) : agent.profile_picture_path ? (
                <div className="w-32 h-32 rounded-3xl overflow-hidden flex items-center justify-center bg-blue-500">
                  <img
                    src={`${API_BASE_URL}/agent/${agent.agent_uid}/profile-picture`}
                    alt={`${agent.name}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(
                        `Failed to load image from direct endpoint for ${agent.name}`
                      );
                      e.target.onerror = null;
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect x='10' y='10' width='80' height='80' rx='20' fill='%234299e1'/%3E%3Ctext x='50' y='65' font-family='Arial' font-size='50' fill='white' text-anchor='middle'%3E" +
                        agent.name.charAt(0).toUpperCase() +
                        "%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Agent info section */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-gray-800">
                  {agent.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditingAgent(agent.agent_uid)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.agent_uid)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="text-gray-600 mt-2 mb-4 line-clamp-3 h-18 overflow-hidden">
                {agent.personality_prompt}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-500 grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <span>Voice: {agent.voice_speaker || "Default"}</span>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="truncate">
                    LLM: {agent.llm_config_uid.substring(0, 8)}...
                  </span>
                </div>

                {agent.custom_voice_path && (
                  <div className="col-span-2 flex items-center mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-green-500">
                      Custom voice available
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentConfiguration;
