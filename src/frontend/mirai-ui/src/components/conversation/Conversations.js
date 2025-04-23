import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../APIModuleConfig";
import { fetchAgents } from "../../services/agentService";
import {
  fetchConversations,
  createConversation as createConversationService,
} from "../../services/conversationService";
import ConversationDetail from "./ConversationDetail";

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetchConversations();
      setConversations(response.conversations || []);
    } catch (err) {
      setError(`Failed to load conversations: ${err.message}`);
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      setLoadingAgents(true);
      const response = await fetchAgents(false); // Doesn't included archived agents
      setAgents(response.agents || []);
      setShowNewConversationModal(true);
    } catch (err) {
      setError(`Failed to load agents: ${err.message}`);
      console.error("Error loading agents:", err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const createConversation = async (agentUid) => {
    try {
      setLoading(true);
      const response = await createConversationService(agentUid);

      setShowNewConversationModal(false);
      await loadConversations();

      setSelectedConversation(response.conversation_uid);
    } catch (err) {
      setError(`Failed to create conversation: ${err.message}`);
      console.error("Error creating conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-800">
      {/* Conversations List Panel */}
      <div
        className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-700 p-3 md:p-4 overflow-y-auto ${
          selectedConversation ? "hidden md:block" : "block"
        }`}
      >
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="text-base md:text-xl font-bold text-white">
            Conversations
          </h3>
          <button
            onClick={handleNewConversation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 md:px-4 md:py-2 rounded-md text-xs md:text-base"
          >
            New
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-3 md:mb-4 text-xs md:text-sm">
            {error}
            <button className="ml-2 font-bold" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        {/* Conversations list */}
        {loading ? (
          <div className="text-center text-gray-400 py-6 md:py-10 text-sm md:text-base">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-400 py-6 md:py-10 text-sm md:text-base">
            No conversations yet. Start a new one!
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation) => (
              <li
                key={conversation.conversation_uid}
                className={`p-2 md:p-3 rounded-md cursor-pointer ${
                  selectedConversation === conversation.conversation_uid
                    ? "bg-gray-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                onClick={() =>
                  setSelectedConversation(conversation.conversation_uid)
                }
              >
                <div className="font-medium text-white text-sm md:text-base">
                  {conversation.title}
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  {formatDate(
                    conversation.updated_at || conversation.created_at
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Conversation Detail Panel */}
      <div
        className={`w-full md:w-2/3 p-3 md:p-4 ${
          selectedConversation ? "block" : "hidden md:block"
        }`}
      >
        {selectedConversation ? (
          <ConversationDetail
            conversationId={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <h3 className="text-gray-400 text-center font-bold text-base md:text-xl">
              Select a conversation or start a new one
            </h3>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-gray-800 rounded-lg p-3 md:p-6 w-full md:w-3/4 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h3 className="text-base md:text-xl font-bold text-white">
                Select an Agent
              </h3>
              <button
                onClick={() => setShowNewConversationModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {loadingAgents ? (
              <div className="text-center text-gray-400 py-6 md:py-10 text-sm md:text-base">
                Loading agents...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.agent_uid}
                    className="bg-gray-700 p-2 md:p-4 rounded-lg hover:bg-gray-600 cursor-pointer"
                    onClick={() => createConversation(agent.agent_uid)}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gray-500 mr-2 md:mr-3 overflow-hidden">
                        {agent.profile_picture_url ? (
                          <img
                            src={agent.profile_picture_url}
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : agent.profile_picture_path ? (
                          <img
                            src={`${API_BASE_URL}${agent.profile_picture_path}`}
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white">
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs md:text-base">
                          {agent.name}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-400">
                          {agent.llm_config_name || "Default LLM"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversations;
