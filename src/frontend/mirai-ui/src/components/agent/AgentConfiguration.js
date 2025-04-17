import React, { useState, useEffect, useCallback } from "react";
import {
  fetchAgents,
  createAgent,
  archiveAgent,
  updateAgent,
  fetchAgentByUid,
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
    voice_speaker: "", // Default voice speaker
    llm_config_uid: "",
    profile_picture_path: "",
    custom_voice_path: "",
    is_archived: false,
  });

  // Fetch agents from the API
  useEffect(() => {
    loadAgents();
  }, []);

  // Fetch LLM configurations when the add form is shown
  useEffect(() => {
    if (showAddForm || editingAgent) {
      loadLlmConfigs();
    }
  }, [showAddForm, editingAgent]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await fetchAgents(false); // Don't include archived agents by default
      setAgents(data.agents || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError("Failed to load agents. Please try again later.");
      setLoading(false);
    }
  };

  const loadLlmConfigs = async () => {
    try {
      setLlmConfigsLoading(true);
      try {
        setLlmConfigs(await fetchLLMConfigs(false));
      } catch (err) {
        console.error("Error fetching LLM configurations:", err);
        setError("Failed to load LLM configurations. Please try again later.");
      }
      setLlmConfigsLoading(false);
    } catch (err) {
      console.error("Error fetching LLM configurations:", err);
      setError("Failed to load LLM configurations. Please try again later.");
      setLlmConfigsLoading(false);
    }
  };

  // Handle input changes for the new agent form
  const handleInputChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      if (editingAgent) {
        setEditingAgent((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        }));
      } else {
        setNewAgent((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        }));
      }
    },
    [editingAgent]
  );

  // Add a new agent
  const addAgent = async () => {
    try {
      // Validate required fields
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

      const data = await createAgent(newAgent);

      // Add the new agent to the list
      setAgents([...agents, data]);

      // Reset the form
      setNewAgent({
        name: "",
        personality_prompt: "",
        voice_speaker: "",
        llm_config_uid: "",
        profile_picture_path: "",
        custom_voice_path: "",
        is_archived: false,
      });

      // Hide the form
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
      // Validate required fields
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

      const updatedAgent = await updateAgent(
        editingAgent.agent_uid,
        editingAgent
      );

      // Update the agent in the list
      setAgents(
        agents.map((agent) =>
          agent.agent_uid === editingAgent.agent_uid ? updatedAgent : agent
        )
      );

      // Reset the editing state
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

  // Delete an agent (hard delete - not implemented in the API)
  const deleteAgent = async (agentUid) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        await archiveAgent(agentUid);

        // Update the local state
        setAgents(agents.filter((agent) => agent.agent_uid !== agentUid));
      } catch (err) {
        console.error("Error deleting agent:", err);
        setError("Failed to delete agent. Please try again.");
      }
    }
  };

  // Toggle the add form
  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    setEditingAgent(null);
    if (!showAddForm) {
      // Reset the form when showing it
      setNewAgent({
        name: "",
        personality_prompt: "",
        voice_speaker: "",
        llm_config_uid: "",
        profile_picture_path: "",
        custom_voice_path: "",
        is_archived: false,
      });
      setError(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Agent Configuration</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={toggleAddForm}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showAddForm ? "Cancel" : "Add New Agent"}
        </button>
      </div>

      {(showAddForm || editingAgent) && (
        <AgentForm
          agentData={editingAgent || newAgent}
          isEditing={!!editingAgent}
          llmConfigs={llmConfigs}
          llmConfigsLoading={llmConfigsLoading}
          handleInputChange={handleInputChange}
          onSubmit={editingAgent ? saveEditedAgent : addAgent}
          onCancel={editingAgent ? cancelEditing : toggleAddForm}
        />
      )}

      {loading ? (
        <p>Loading agents...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.agent_uid}
              className="bg-white shadow-md rounded overflow-hidden"
            >
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2">{agent.name}</h2>
                <p className="text-gray-700 mb-2">
                  <span className="font-bold">Voice:</span>{" "}
                  {agent.voice_speaker}
                </p>
                <p className="text-gray-700 mb-4 line-clamp-3">
                  <span className="font-bold">Personality:</span>{" "}
                  {agent.personality_prompt}
                </p>
                <div className="flex justify-between">
                  <button
                    onClick={() => startEditingAgent(agent.agent_uid)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.agent_uid)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentConfiguration;
