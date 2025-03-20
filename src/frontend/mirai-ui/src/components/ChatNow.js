import React from "react";

const ChatNow = () => {
  return (
    <div className="content">
      <h3>Chat Now</h3>
      <div className="chat-window">
        <div className="user-message">How old is Barack Obama?</div>
        <div className="ai-message">
          Barack Obama is currently 62 years old.
        </div>
        <div className="user-message">Tell me a joke.</div>
        <div className="ai-message">
          Why don't scientists trust atoms? Because they make up everything!
        </div>
        <input
          type="text"
          placeholder="Type your message..."
          className="chat-input"
        />
        <button>Send</button>
      </div>
    </div>
  );
};

export default ChatNow;
