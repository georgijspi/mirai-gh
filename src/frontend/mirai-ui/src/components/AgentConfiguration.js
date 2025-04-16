import React, { useState, useEffect } from "react";

const AgentConfiguration = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    personality_prompt: "",
    voice_speaker: "",
    llm_config_uid: "",
    profile_picture_path: "",
    custom_voice_path: "",
    is_archived: false,
  });

  // Fetch agents from the API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:8005/mirai/api/agent/list"
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setAgents(data.agents || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError("Failed to load agents. Please try again later.");
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Handle input changes for the new agent form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAgent({
      ...newAgent,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Add a new agent
  const addAgent = async () => {
    try {
      const response = await fetch("http://localhost:8005/mirai/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAgent),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

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
    } catch (err) {
      console.error("Error adding agent:", err);
      setError("Failed to add agent. Please try again.");
    }
  };

  // Toggle archive status of an agent
  const toggleArchive = async (agentUid, currentStatus) => {
    try {
      const updatedAgent = {
        ...agents.find((agent) => agent.agent_uid === agentUid),
        is_archived: !currentStatus,
      };

      const response = await fetch(
        `http://localhost:8005/mirai/api/agent/${agentUid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedAgent),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Update the agent in the list
      setAgents(
        agents.map((agent) =>
          agent.agent_uid === agentUid
            ? { ...agent, is_archived: !currentStatus }
            : agent
        )
      );
    } catch (err) {
      console.error("Error updating agent:", err);
      setError("Failed to update agent. Please try again.");
    }
  };

  // Delete an agent
  const deleteAgent = async (agentUid) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8005/mirai/api/agent/${agentUid}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Remove the agent from the list
      setAgents(agents.filter((agent) => agent.agent_uid !== agentUid));
    } catch (err) {
      console.error("Error deleting agent:", err);
      setError("Failed to delete agent. Please try again.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        Agent Configuration
      </h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.agent_uid}
                className={`bg-white dark:bg-gray-700 shadow-md rounded-lg p-4 ${
                  agent.is_archived ? "opacity-60" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {agent.name}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        toggleArchive(agent.agent_uid, agent.is_archived)
                      }
                      className={`px-2 py-1 rounded text-xs ${
                        agent.is_archived
                          ? "bg-green-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {agent.is_archived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.agent_uid)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">Personality:</span>{" "}
                    {agent.personality_prompt.substring(0, 100)}
                    {agent.personality_prompt.length > 100 ? "..." : ""}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">Voice Speaker:</span>{" "}
                    {agent.voice_speaker}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">LLM Config:</span>{" "}
                    {agent.llm_config_uid}
                  </p>
                </div>

                {agent.profile_picture_path && (
                  <div className="mb-4">
                    <img
                      src={agent.profile_picture_path}
                      alt={`${agent.name} profile`}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>
                    Created: {new Date(agent.created_at).toLocaleDateString()}
                  </p>
                  <p>
                    Updated: {new Date(agent.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {showAddForm ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Add New Agent
                </h4>

                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newAgent.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Personality Prompt
                  </label>
                  <textarea
                    name="personality_prompt"
                    value={newAgent.personality_prompt}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Voice Speaker
                  </label>
                  <input
                    type="text"
                    name="voice_speaker"
                    value={newAgent.voice_speaker}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    LLM Config UID
                  </label>
                  <input
                    type="text"
                    name="llm_config_uid"
                    value={newAgent.llm_config_uid}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Profile Picture Path
                  </label>
                  <input
                    type="text"
                    name="profile_picture_path"
                    value={newAgent.profile_picture_path}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Custom Voice Path
                  </label>
                  <input
                    type="text"
                    name="custom_voice_path"
                    value={newAgent.custom_voice_path}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_archived"
                      checked={newAgent.is_archived}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      Archived
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addAgent}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
                  >
                    Add Agent
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition mt-6"
            >
              Add New Agent
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default AgentConfiguration;
