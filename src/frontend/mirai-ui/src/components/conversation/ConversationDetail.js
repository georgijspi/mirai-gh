import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL, TTS_ENDPOINTS } from "../APIModuleConfig";
import { playMessageAudio } from "../../utils/audioUtils";
import {
  fetchConversationById,
  sendMessage as sendMessageService,
} from "../../services/conversationService";
import websocketService from "../../services/websocketService";

const ConversationDetail = ({ conversationId, onBack }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const wsEndpoint = useRef(`conversation/${conversationId}`);

  // Load conversation data when component mounts or conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation();
      setupWebSocket();
    }

    return () => {
      // Clean up WebSocket on unmount
      websocketService.disconnect(wsEndpoint.current);
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation data and messages
  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await fetchConversationById(conversationId);
      setConversation(response);
      setMessages(response.messages || []);
    } catch (err) {
      setError(`Failed to load conversation: ${err.message}`);
      console.error("Error loading conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Setup WebSocket connection for real-time messages
  const setupWebSocket = () => {
    try {
      // Update the WebSocket endpoint
      wsEndpoint.current = `conversation/${conversationId}`;

      // Connect to the WebSocket using the service
      websocketService.connect(wsEndpoint.current, handleWebSocketMessage);
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      setError(
        "WebSocket connection failed. Messages will not update in real-time."
      );
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log("WebSocket message received:", data);

    if (data && data.type === "agent_response" && data.message) {
      // Add the agent message to the chat if it's not already there
      setMessages((prev) => {
        // Avoid adding duplicate messages
        if (prev.some((m) => m.message_uid === data.message.message_uid)) {
          return prev;
        }

        const updatedMessages = [...prev, data.message];

        // Play the audio if available
        if (data.message.audio_stream_url) {
          setTimeout(() => {
            let audioUrl = data.message.audio_stream_url;

            // If the URL doesn't start with http/https, prefix with server base URL
            if (!audioUrl.startsWith("http")) {
              // Remove leading slash if present to avoid double slashes
              if (audioUrl.startsWith("/")) {
                audioUrl = audioUrl.substring(1);
              }
              audioUrl = `http://localhost:8005/${audioUrl}`;
            }

            console.log("Playing audio from URL:", audioUrl);
            playMessageAudio(audioUrl);
          }, 500);
        }

        return updatedMessages;
      });
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (input.trim() === "") return;

    try {
      setSending(true);

      // Add user message to UI immediately
      const userMessage = {
        content: input,
        message_type: "user",
        conversation_uid: conversationId,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Clear input field
      setInput("");

      // Send message to API using the service
      await sendMessageService({
        content: input,
        conversation_uid: conversationId,
      });

      console.log("Message sent successfully");
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Play audio for a message
  const handlePlayAudio = (message) => {
    if (message.audio_stream_url) {
      // Handle different URL formats
      let audioUrl = message.audio_stream_url;

      // If the URL doesn't start with http/https, prefix with server base URL
      if (!audioUrl.startsWith("http")) {
        // Remove leading slash if present to avoid double slashes
        if (audioUrl.startsWith("/")) {
          audioUrl = audioUrl.substring(1);
        }
        audioUrl = `http://localhost:8005/${audioUrl}`;
      }

      console.log("Manual play of audio from URL:", audioUrl);
      playMessageAudio(audioUrl);
    }
  };

  // Format date for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading && !conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-xl">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-700">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-3 text-gray-400 hover:text-white"
          >
            ←
          </button>
          <h3 className="text-xl font-bold text-white">
            {conversation?.title || "Conversation"}
          </h3>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500 text-white p-2 rounded my-2">
          {error}
          <button className="ml-2 font-bold" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <h1 className="text-gray-400 text-center font-bold text-xl">
              No messages yet. Start a conversation!
            </h1>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.message_uid || index}
              className={`flex ${
                message.message_type === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.message_type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold">
                    {message.message_type === "user"
                      ? "You"
                      : message.metadata?.agent_name || "AI Assistant"}
                  </div>
                  <div className="text-xs opacity-75">
                    {formatTime(message.created_at)}
                  </div>
                </div>

                <div className="break-words whitespace-pre-wrap">
                  {message.content}
                </div>

                {message.message_type === "agent" &&
                  message.audio_stream_url && (
                    <button
                      onClick={() => handlePlayAudio(message)}
                      className="text-blue-300 hover:text-blue-200 text-xs mt-1 flex items-center"
                    >
                      <span>🔊 Play Audio</span>
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded-l-lg p-3 outline-none resize-none"
            rows="2"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || input.trim() === ""}
            className={`px-4 rounded-r-lg ${
              sending || input.trim() === ""
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;
