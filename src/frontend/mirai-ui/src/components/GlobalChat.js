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
  const [isLoading, setSending] = useState(false);
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

      const userMessage = { content: input, message_type: "user" };
      setMessages((prev) => [...prev, userMessage]);

      console.log("Sending message...");
      await sendGlobalMessage(input);

      console.log("Message sent successfully");
      setInput("");
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

  const handleTranscription = (transcription) => {
    if (transcription.trim() === "") return;

    const userMessage = { text: transcription, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-800">
      <div className="w-4/5 bg-gray-700 p-6 rounded-lg shadow-lg flex flex-col h-[80%]">
        <h3 className="text-2xl font-bold mb-4 text-white text-center">
          Global Chat
        </h3>

        {/* Error message */}
        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-4">
            {error}
            <button className="ml-2 font-bold" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        {/* Chat history area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <h1 className="text-gray-400 text-center font-bold text-2xl">
                  {isLoading ? "Loading..." : "MirAI is ready to assist you!"}
                </h1>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.message_uid || index}
                  className={`p-2 ${
                    message.message_type === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div className="flex items-center">
                    {message.message_type === "agent" &&
                      message.audio_stream_url && (
                        <button
                          onClick={() => handlePlayAudio(message)}
                          className="mr-2 text-blue-400 hover:text-blue-300"
                        >
                          🔊
                        </button>
                      )}
                    <span
                      className={`inline-block px-3 py-1 text-white mr-2 mb-2 ${
                        message.message_type === "user"
                          ? "bg-gray-500 rounded-tl-[10px] rounded-bl-[10px] rounded-br-[10px]"
                          : "bg-gray-700 rounded-tr-[10px] rounded-bl-[10px] rounded-br-[10px]"
                      }`}
                    >
                      {message.content}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <div className="px-2"></div>
          <VoiceWidget onTranscription={handleTranscription} config={config} />
          <button
            onClick={sendMessage}
            className={`bg-blue-500 text-white rounded-md hover:bg-blue-600 transition px-4 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalChat;
