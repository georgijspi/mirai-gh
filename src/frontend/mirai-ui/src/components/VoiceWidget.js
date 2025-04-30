import React, { useEffect, useState, useRef } from "react";
import { useLeopard } from "@picovoice/leopard-react";
import { usePorcupine } from "@picovoice/porcupine-react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { registerAudioCallback, unregisterAudioCallback, getAudioPlaybackState } from "../utils/audioUtils";

// List of built-in keywords for Porcupine
const builtInKeywords = [
  "Alexa",
  "Americano",
  "Blueberry",
  "Bumblebee",
  "Computer",
  "Grapefruit",
  "Grasshopper",
  "Hey Google",
  "Hey Siri",
  "Jarvis",
  "Okay Google",
  "Picovoice",
  "Porcupine",
  "Terminator",
];

export default function VoiceWidget({
  onTranscription,
  config: wrappedConfig,
}) {
  const config = wrappedConfig.config || wrappedConfig;

  const [initError, setInitError] = useState(null);
  const [wakeWordMode, setWakeWordMode] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const wakeWordTimeoutRef = useRef(null);
  const wasListeningBeforeAudioRef = useRef(false);

  // Leopard STT hook
  const {
    result: sttResult,
    isLoaded: isSttLoaded,
    error: sttError,
    init: initStt,
    startRecording: startSttRecording,
    stopRecording: stopSttRecording,
    isRecording: isSttRecording,
    recordingElapsedSec,
    release: releaseStt,
  } = useLeopard();

  // Porcupine wake word hook
  const {
    keywordDetection,
    isLoaded: isWakeWordLoaded,
    isListening: isWakeWordListening,
    error: wakeWordError,
    init: initWakeWord,
    start: startWakeWordDetection,
    stop: stopWakeWordDetection,
    release: releaseWakeWord,
  } = usePorcupine();

  // Handle audio playback state
  useEffect(() => {
    // Check initial state
    const { isPlaying } = getAudioPlaybackState();
    setIsAudioPlaying(isPlaying);

    const handleAudioStart = () => {
      setIsAudioPlaying(true);
      
      // Store current state to restore after audio ends
      wasListeningBeforeAudioRef.current = wakeWordMode;
      
      // If STT is recording, stop it
      if (isSttRecording) {
        stopSttRecording().catch(err => {
          console.error("Error stopping STT recording:", err);
        });
      }
      
      // If wake word detection is active, stop it
      if (isWakeWordListening) {
        stopWakeWordDetection().catch(err => {
          console.error("Error stopping wake word detection:", err);
        });
      }
    };

    const handleAudioEnd = () => {
      setIsAudioPlaying(false);
      
      // Restore previous listening state
      if (wasListeningBeforeAudioRef.current) {
        // If we were in wake word mode, resume it
        if (wakeWordMode) {
          startWakeWordDetection().catch(err => {
            console.error("Error restarting wake word detection:", err);
          });
        }
      }
    };

    // Register callbacks
    registerAudioCallback('onPlaybackStart', handleAudioStart);
    registerAudioCallback('onPlaybackEnd', handleAudioEnd);

    // Cleanup
    return () => {
      unregisterAudioCallback('onPlaybackStart', handleAudioStart);
      unregisterAudioCallback('onPlaybackEnd', handleAudioEnd);
    };
  }, [wakeWordMode, isSttRecording, isWakeWordListening]);

  const validateAccessKey = () => {
    if (!config.accessKey || config.accessKey === "") {
      setInitError(
        "Access Key not provided. Please set your Picovoice access key in the LLM Performance tab."
      );
      return false;
    }
    return true;
  };

  const initSttEngine = async () => {
    try {
      if (!validateAccessKey()) return false;

      await initStt(config.accessKey, {
        publicPath: config.leopardModelPublicPath,
      });

      return true;
    } catch (e) {
      console.error("STT initialization error:", e);
      setInitError(`Error initializing Leopard STT: ${e.message || e}`);
      return false;
    }
  };

  const initWakeWordEngine = async () => {
    try {
      if (!validateAccessKey()) return false;

      let keyword;

      if (config.useCustomKeyword && config.customKeywordModelPath) {
        keyword = {
          publicPath: config.customKeywordModelPath,
          label: config.customKeywordLabel || "Custom Keyword",
        };
      } else if (builtInKeywords.includes(config.keywordModel)) {
        keyword = {
          builtin: config.keywordModel,
        };
      } else {
        throw new Error("Invalid keyword configuration");
      }

      await initWakeWord(config.accessKey, [keyword], {
        publicPath: config.porcupineModelPublicPath,
      });

      return true;
    } catch (e) {
      console.error("Wake word initialization error:", e);
      setInitError(`Error with wake word: ${e.message || e}`);
      return false;
    }
  };

  // Initialize both engines when config changes
  useEffect(() => {
    const initialize = async () => {
      setInitError(null);
      await initSttEngine();
      await initWakeWordEngine();
    };

    initialize();

    // Clean up on unmount
    return () => {
      if (isSttLoaded) {
        releaseStt();
      }
      if (isWakeWordLoaded) {
        releaseWakeWord();
      }
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
    };
  }, [
    config.accessKey,
    config.leopardModelPublicPath,
    config.keywordModel,
    config.porcupineModelPublicPath,
    config.useCustomKeyword,
    config.customKeywordModelPath,
  ]);

  // Handle STT results
  useEffect(() => {
    if (sttResult !== null) {
      if (sttResult.transcript && sttResult.transcript.trim() !== "") {
        onTranscription(sttResult.transcript);

        if (wakeWordMode) {
          // After transcription is complete, stop STT recording and go back to wake word detection
          stopSttRecording().then(() => {
            setWakeWordDetected(false);
            startWakeWordDetection();
          });
        }
      }
    }
  }, [sttResult]);

  // Handle wake word detection
  useEffect(() => {
    if (keywordDetection !== null && wakeWordMode && !wakeWordDetected && !isAudioPlaying) {
      setWakeWordDetected(true);

      // Stop wake word detection and start STT recording
      stopWakeWordDetection().then(() => {
        startSttRecording();

        // Set a timeout to stop recording if it goes too long (5 seconds max)
        wakeWordTimeoutRef.current = setTimeout(() => {
          if (isSttRecording) {
            stopSttRecording().then(() => {
              setWakeWordDetected(false);
              startWakeWordDetection();
            });
          }
        }, 5000);
      });
    }
  }, [keywordDetection, wakeWordMode, wakeWordDetected, isAudioPlaying]);

  // Handle errors
  useEffect(() => {
    if (sttError) {
      setInitError(`Error with Leopard: ${sttError.message || sttError}`);
    }

    if (wakeWordError) {
      setInitError(
        `Error with wake word: ${wakeWordError.message || wakeWordError}`
      );
    }
  }, [sttError, wakeWordError]);

  // Toggle between different recording modes
  const toggleVoiceInput = async () => {
    try {
      // Don't allow toggle during audio playback
      if (isAudioPlaying) {
        return;
      }
      
      if (!wakeWordMode) {
        await startWakeWordDetection();
        setWakeWordMode(true);
      } else {
        if (isSttRecording) {
          await stopSttRecording();
        } else if (isWakeWordListening) {
          await stopWakeWordDetection();
        }
        
        setWakeWordMode(false);
        setWakeWordDetected(false);
      }
    } catch (error) {
      console.error("Error toggling voice input:", error);
      setInitError(`Error: ${error.message}`);
    }
  };

  // Determine the current status for UI display
  const getStatus = () => {
    if (isAudioPlaying) {
      return "Voice input paused during audio playback";
    }
    
    if (wakeWordMode) {
      if (wakeWordDetected) {
        return "Listening...";
      } else {
        const wakeWord = config.useCustomKeyword
          ? config.customKeywordLabel || "Custom Keyword"
          : config.keywordModel;
        return `Waiting for wake word "${wakeWord}"...`;
      }
    } else if (isSttRecording) {
      return "Recording...";
    } else {
      return null;
    }
  };

  const status = getStatus();

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={toggleVoiceInput}
        className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 m-1 ${
          !isSttLoaded || !isWakeWordLoaded
            ? "bg-gray-500"
            : isAudioPlaying
            ? "bg-blue-300 cursor-not-allowed"
            : wakeWordMode
            ? "bg-green-500 hover:bg-green-600"
            : isSttRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        title={
          !isSttLoaded || !isWakeWordLoaded
            ? initError || "Speech recognition not initialized"
            : isAudioPlaying
            ? "Voice input disabled during audio playback"
            : wakeWordMode
            ? "Wake word mode active"
            : isSttRecording
            ? "Stop recording"
            : "Start voice input"
        }
        disabled={isAudioPlaying}
      >
        {isSttRecording || (wakeWordMode && wakeWordDetected) ? (
          <FaMicrophone size={24} />
        ) : (
          <FaMicrophoneSlash size={24} />
        )}
      </button>

      {initError && (
        <div className="text-red-500 text-xs absolute bottom-16 bg-gray-800 p-2 rounded">
          {initError}
        </div>
      )}

      {status && (
        <div className="text-green-500 text-xs absolute bottom-16 bg-gray-800 p-2 rounded">
          {status} {isSttRecording && `(${Math.round(recordingElapsedSec)}s)`}
        </div>
      )}
    </div>
  );
}
