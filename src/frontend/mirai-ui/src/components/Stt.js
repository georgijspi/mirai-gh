import React, { useEffect } from "react";
import { useLeopard } from "@picovoice/leopard-react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

export default function SpeechToText({ onTranscription, config }) {
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

  const initEngine = async () => {
    try {
      await init(config.accessKey, { publicPath: config.publicPath });
    } catch (e) {
      console.error("Error initializing Leopard:", e);
    }
  };

  useEffect(() => {
    initEngine();
  }, [config]);

  useEffect(() => {
    if (result !== null) {
      onTranscription(result.transcript);
    }
  }, [result]);

  const toggleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={toggleRecord}
        className="bg-blue-500 p-3 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-30 m-1"
      >
        {isRecording ? (
          <FaMicrophone size={24} />
        ) : (
          <FaMicrophoneSlash size={24} />
        )}
      </button>
    </div>
  );
}
