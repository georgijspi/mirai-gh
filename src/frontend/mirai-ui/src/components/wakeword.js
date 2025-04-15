import React, { useEffect } from "react";
import { usePorcupine } from "@picovoice/porcupine-react";

export default function Wakeword() {
  const {
    keywordDetection,
    isLoaded,
    isListening,
    error,
    init,
    start,
    stop,
    release,
  } = usePorcupine();

  const porcupineKeyword = {
    publicPath: "/models/grapefruit_wasm.ppn",
    label: "grapefruit", // An arbitrary string used to identify the keyword once the detection occurs.
  };

  const porcupineModel = {
    publicPath: "/models/pv_porcupine.wasm",
  };
  //   src\frontend\mirai-ui\public\models\pv_porcupine.wasm
  const ACCESS_KEY = "htYQGBJfO5TGG+9srWAQkzaA/5ld1v31RVwHynOHMvZb0Q//ZL2z7g==";

  useEffect(() => {
    init(ACCESS_KEY, porcupineKeyword, porcupineModel);
    if (isLoaded) {
      console.log("Porcupine is loaded");
    }
  }, []);

  useEffect(() => {
    if (keywordDetection !== null) {
      console.log("Keyword detected:", keywordDetection);
      // ... use keyword detection result
    }
  }, [keywordDetection]);

  // ... render component
  return (
    <div>
      <h1>Porcupine Wake Word Detection</h1>
      <p>Say the wake word to test the integration.</p>
      <button onClick={start} disabled={!isLoaded || isListening}>
        Start Listening
      </button>
      <button onClick={stop} disabled={!isListening}>
        Stop Listening
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
