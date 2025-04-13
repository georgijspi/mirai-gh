import React, { useEffect } from "react";
import { useLeopard } from "@picovoice/leopard-react";

export default function SpeechToText({ onTranscription }) {
  const {
    result,
    isLoaded,
    error,
    init,
    processFile,
    startRecording,
    stopRecording,
    isRecording,
    recordingElapsedSec,
    release,
  } = useLeopard();

  const leopardModel = {
    publicPath: "/model/leopard_params.pv",
  };
  const accessKey = "htYQGBJfO5TGG+9srWAQkzaA/5ld1v31RVwHynOHMvZb0Q//ZL2z7g==";

  const initEngine = async () => {
    try {
      await init(accessKey, leopardModel);
    } catch (e) {
      console.error("Error initializing Leopard:", e);
    }
  };
  useEffect(() => {
    if (result !== null) {
      if (onTranscription) {
        onTranscription(result.transcript);
      }
    }
  }, [result, onTranscription]);

  const toggleRecord = async () => {
    if (!isLoaded) {
      initEngine();
    }
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div>
      <button onClick={initEngine} disabled={isLoaded}>
        Initialize Leopard
      </button>
      <button onClick={toggleRecord}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <p>{result?.transcript}</p>
    </div>
  );
}
