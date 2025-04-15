import React, { useState } from "react";
import SpeechToText from "./Stt";

const ChatNow = ({ config }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const botResponse = {
        text: "This is a simulated response.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleTranscription = (transcription) => {
    setInput(transcription);
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-800">
      <div className="w-4/5 bg-gray-700 p-6 rounded-lg shadow-lg flex flex-col h-[80%]">
        <h3 className="text-2xl font-bold mb-4 text-white text-center">
          Chat Now
        </h3>
        {/* Chat history area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <h1 className="text-gray-400 text-center font-bold text-2xl">
                  MirAI is ready to assist you!
                </h1>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 ${
                    message.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-1 text-white mr-2 mb-2 ${
                      message.sender === "user"
                        ? "bg-gray-500 rounded-tl-[10px] rounded-bl-[10px] rounded-br-[10px]"
                        : "bg-gray-700 rounded-tr-[10px] rounded-bl-[10px] rounded-br-[10px]"
                    }`}
                  >
                    {message.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Input Area */}
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 m-1 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <SpeechToText onTranscription={handleTranscription} config={config} />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white rounded-md hover:bg-blue-600 transition m-1"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatNow;
