import React, { useState, useEffect, useRef } from "react";
import VoiceWidget from "./VoiceWidget";
import { playMessageAudio } from "../utils/audioUtils";
import websocketService from "../services/websocketService";
import {
  fetchGlobalConversation,
  sendGlobalMessage,
} from "../services/globalConversationService";
import { streamSpeech } from "../services/ttsService";

const GlobalChat = (config) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [Sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load Conversation and initialize WebSocket connection on start
  useEffect(() => {
    loadGlobalConversation();
    function handleWebSocketMessage(data) {
      if (data && data.type === "agent_response" && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.message_uid === data.message.message_uid)) {
            return prev;
          }
          const updatedMessages = [...prev, data.message];
          if (data.message.audio_stream_url) {
            setTimeout(() => {
              let audioUrl = data.message.audio_stream_url;
              if (!audioUrl.startsWith("http")) {
                if (audioUrl.startsWith("/")) {
                  audioUrl = audioUrl.substring(1);
                }
                audioUrl = `http://localhost:8005/${audioUrl}`;
              }
              playMessageAudio(audioUrl);
            }, 500);
          }
          return updatedMessages;
        });
      }
    }
    websocketService.connect("global", handleWebSocketMessage);
    return () => {
      websocketService.disconnect("global");
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load global conversation messages
  const loadGlobalConversation = async () => {
    try {
      setSending(true);

      console.log("Fetching global conversation...");
      const data = await fetchGlobalConversation();
      console.log("Loaded messages:", data.messages?.length || 0);
      setMessages(data.messages || []);
    } catch (err) {
      setError(`Failed to load messages: ${err.message}`);
      console.error("Error loading conversations:", err);
      // Initialize with empty messages array on error
      setMessages([]);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (input.trim() === "") return;

    try {
      setSending(true);

      // Add user message to UI immediately
      const userMessage = {
        content: input,
        message_type: "user",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setInput("");

      await sendGlobalMessage(input);

      console.log("Message sent successfully");
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePlayAudio = (message) => {
    if (message.audio_stream_url) {
      const messageId = message.message_uid;
      // For global chat, conversationId is 'global'
      streamSpeech(messageId, "global")
        .then((response) => response.blob())
        .then((audioBlob) => {
          const audioUrl = URL.createObjectURL(audioBlob);
          playMessageAudio(audioUrl);
        })
        .catch((error) => {
          console.error("Error streaming audio:", error);
        });
    }
  };

  const handleTranscription = async (transcription) => {
    if (transcription.trim() === "") return;

    try {
      setSending(true);

      const userMessage = {
        content: transcription,
        message_type: "user",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      await sendGlobalMessage(transcription);

      console.log("Message sent successfully");
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-800">
      <div className="w-4/5 bg-gray-700 p-6 rounded-lg shadow-lg flex flex-col h-[80%]">
        <h3 className="text-2xl font-bold mb-4 text-white text-center">
          Global Chat
        </h3>

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
                {Sending ? "Loading..." : "MirAI is ready to assist you!"}
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
                      : "bg-gray-800 text-white"
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
                        className="text-blu e-300 hover:text-blue-200 text-xs mt-1 flex items-center"
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
              className="flex-1 bg-gray-600 text-white rounded-l-lg p-3 outline-none resize-none"
              rows="2"
              disabled={Sending}
            />
            <div className="px-2 flex items-center">
              <VoiceWidget
                onTranscription={handleTranscription}
                config={config}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={Sending || input.trim() === ""}
              className={`px-4 rounded-r-lg ${
                Sending || input.trim() === ""
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {Sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalChat;
