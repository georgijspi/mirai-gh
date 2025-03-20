import React, { useState } from "react";
import axios from "axios";

const TestUI = () => {
  const [text, settext] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);

  const handleWakeWord = async () => {
    const response = await axios.post("http://localhost:5000/wake-word");
    if (response.data.wake_detected) {
      settext("Wake word detected!");
    }
  };

  const handleSpeechToText = async () => {
    const response = await axios.post("http://localhost:5000/speech-to-text");
    settext(response.data.text);
  };

  const handleTextToSpeech = async () => {
    const response = await axios.post("http://localhost:5000/text-to-speech", {
      text: text,
    });
    setAudioUrl(response.data.audio_url);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>MirAI Test UI</h1>
      <button
        onClick={handleWakeWord}
        style={{ margin: "10px", padding: "10px" }}
      >
        Test Wake Word
      </button>
      <button
        onClick={handleSpeechToText}
        style={{ margin: "10px", padding: "10px" }}
      >
        Test Speech Recognition
      </button>
      <button
        onClick={handleTextToSpeech}
        style={{ margin: "10px", padding: "10px" }}
      >
        Test Text-to-Speech
      </button>
      {text && <p>Recognized Text: {text}</p>}
      {audioUrl && <audio controls src={audioUrl}></audio>}
    </div>
  );
};

export default TestUI;
