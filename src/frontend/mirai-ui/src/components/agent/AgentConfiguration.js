import React, { useState, useEffect } from "react";
import {
  fetchAgents,
  createAgent,
  archiveAgent,
  updateAgent,
  fetchAgentByUid,
  uploadProfilePicture,
} from "../../services/agentService";
import { fetchLLMConfigs } from "../../services/llmService";
import AgentForm from "./AgentForm";

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
    custom_voice_path: "",
    is_archived: false,
  });

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await fetchAgents(false);
      console.log("data", data);
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
      delete agentData.profile_picture; // Remove the file from the agent data
      const data = await createAgent(agentData);

      // If there's a profile picture, upload it
      if (newAgent.profile_picture) {
        try {
          await uploadProfilePicture(data.agent_uid, newAgent.profile_picture);
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
          // Don't fail the whole operation if profile picture upload fails
        }
      }

      setAgents([...agents, data]);
      setNewAgent({
        name: "",
        personality_prompt: "",
        voice_speaker: "",
        llm_config_uid: "",
        profile_picture: null,
        custom_voice_path: "",
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
      delete agentData.profile_picture; // Remove the file from the agent data
      const updatedAgent = await updateAgent(editingAgent.agent_uid, agentData);

      // If there's a new profile picture, upload it
      if (editingAgent.profile_picture) {
        try {
          await uploadProfilePicture(
            editingAgent.agent_uid,
            editingAgent.profile_picture
          );
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
          // Don't fail the whole operation if profile picture upload fails
        }
      }

      setAgents(
        agents.map((agent) =>
          agent.agent_uid === editingAgent.agent_uid ? updatedAgent : agent
        )
      );

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
        setAgents(agents.filter((agent) => agent.agent_uid !== agentUid));
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
        <h2 className="text-2xl font-bold">Agent Configuration</h2>
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
            className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{agent.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEditingAgent(agent.agent_uid)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteAgent(agent.agent_uid)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-gray-600 mt-2 line-clamp-3">
              {agent.personality_prompt}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Voice: {agent.voice_speaker || "Default"}</p>
              <p>LLM Config: {agent.llm_config_uid}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentConfiguration;
