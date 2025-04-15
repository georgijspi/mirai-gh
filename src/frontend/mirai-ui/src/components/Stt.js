import React, { useEffect, useState, useRef } from "react";
import { useLeopard } from "@picovoice/leopard-react";
import { usePorcupine } from "@picovoice/porcupine-react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

// List of built-in keywords for Porcupine
const builtInKeywords = ["Alexa","Americano","Blueberry","Bumblebee","Computer","Grapefruit","Grasshopper","Hey Google","Hey Siri","Jarvis","Okay Google","Picovoice","Porcupine","Terminator"];

export default function SpeechToText({ onTranscription, config }) {
  const [initError, setInitError] = useState(null);
  const [wakeWordMode, setWakeWordMode] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const wakeWordTimeoutRef = useRef(null);
  
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

  // Initialize Leopard STT engine
  const initSttEngine = async () => {
    try {
      if (!config.accessKey || config.accessKey === "") {
        setInitError("Access Key not provided. Please set your Picovoice access key in the LLM Performance tab.");
        return false;
      }
      
      console.log("Initializing Leopard with:", {
        accessKey: config.accessKey ? "✓ Provided" : "✗ Missing",
        modelPath: config.leopardModelPublicPath
      });
      
      await initStt(config.accessKey, {
        publicPath: config.leopardModelPublicPath,
      });
      
      console.log("Leopard initialization successful");
      return true;
    } catch (e) {
      console.error("Error initializing Leopard:", e);
      setInitError(`Error initializing Leopard STT: ${e.message || e}`);
      return false;
    }
  };

  // Initialize Porcupine wake word engine
  const initWakeWordEngine = async () => {
    try {
      if (!config.accessKey || config.accessKey === "") {
        setInitError("Access Key not provided. Please set your Picovoice access key in the LLM Performance tab.");
        return false;
      }
      
      console.log("Initializing Porcupine with:", {
        accessKey: config.accessKey ? "✓ Provided" : "✗ Missing",
        wakeWordModel: config.wakeWordModel,
        sensitivity: config.wakeWordSensitivity
      });
      
      // Fixed initialization with the Grapefruit model file or other built-in keywords
      let keyword;
      
      if (builtInKeywords.includes(config.wakeWordModel)) {
        keyword = {
          builtin: config.wakeWordModel
        };
      } else {
        // Default to Grapefruit as the wake word
        keyword = {
          builtin: "Grapefruit"
        };
        console.log("Using default wake word 'Grapefruit' - the specified wake word was not found in the list of built-in keywords");
      }
      
      const porcupineParams = {
        publicPath: "/models/porcupine_params.pv" // Base model for wake word detection
      };
      
      await initWakeWord(
        config.accessKey,
        [keyword],
        { 
          sensitivity: config.wakeWordSensitivity || 0.5,
          ...porcupineParams
        }
      );
      
      console.log("Porcupine wake word initialization successful");
      return true;
    } catch (e) {
      console.error("Error initializing Porcupine:", e);
      setInitError(`Error with wake word: ${e.message || e}`);
      return false;
    }
  };

  // Initialize both engines when config changes
  useEffect(() => {
    console.log("STT config changed:", config);
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
  }, [config.accessKey, config.leopardModelPublicPath, config.wakeWordModel, config.wakeWordSensitivity]);

  // Handle STT results
  useEffect(() => {
    if (sttResult !== null) {
      console.log("Transcription result:", sttResult.transcript);
      if (sttResult.transcript && sttResult.transcript.trim() !== "") {
        onTranscription(sttResult.transcript);
        
        if (wakeWordMode) {
          // After transcription is complete, stop STT recording and go back to wake word detection
          stopSttRecording().then(() => {
            setWakeWordDetected(false);
            startWakeWordDetection();
            console.log("Returned to wake word detection mode");
          });
        }
      }
    }
  }, [sttResult, onTranscription]);

  // Handle wake word detection
  useEffect(() => {
    if (keywordDetection !== null && wakeWordMode && !wakeWordDetected) {
      console.log("Wake word detected:", keywordDetection);
      setWakeWordDetected(true);
      
      // Stop wake word detection and start STT recording
      stopWakeWordDetection().then(() => {
        console.log("Starting STT recording after wake word");
        startSttRecording();
        
        // Set a timeout to stop recording if it goes too long (15 seconds max)
        wakeWordTimeoutRef.current = setTimeout(() => {
          if (isSttRecording) {
            console.log("Max recording time reached, stopping STT");
            stopSttRecording().then(() => {
              setWakeWordDetected(false);
              startWakeWordDetection();
            });
          }
        }, 15000);
      });
    }
  }, [keywordDetection, wakeWordMode, wakeWordDetected]);

  // Handle errors
  useEffect(() => {
    if (sttError) {
      console.error("Leopard error:", sttError);
      setInitError(`Error with Leopard: ${sttError.message || sttError}`);
    }
    
    if (wakeWordError) {
      console.error("Porcupine error:", wakeWordError);
      setInitError(`Error with wake word: ${wakeWordError.message || wakeWordError}`);
    }
  }, [sttError, wakeWordError]);

  // Toggle between different recording modes
  const toggleVoiceInput = async () => {
    // If there's an error with either engine, show the error
    if (!isSttLoaded || !isWakeWordLoaded) {
      alert(initError || "Speech recognition not initialized. Please check your access key in the LLM Performance tab.");
      return;
    }
    
    try {
      if (wakeWordMode) {
        // Currently in wake word mode, turn it off completely
        console.log("Disabling wake word mode");
        setWakeWordMode(false);
        
        if (isWakeWordListening) {
          await stopWakeWordDetection();
        }
        
        if (isSttRecording) {
          await stopSttRecording();
        }
        
        setWakeWordDetected(false);
        if (wakeWordTimeoutRef.current) {
          clearTimeout(wakeWordTimeoutRef.current);
        }
      } else if (isSttRecording) {
        // Currently directly recording STT, stop it
        console.log("Stopping direct STT recording");
        await stopSttRecording();
      } else {
        // Not recording anything, decide which mode to enter
        const useWakeWord = window.confirm("Use wake word mode? Click OK to enable wake word detection, or Cancel for direct recording.");
        
        if (useWakeWord) {
          // Start wake word mode
          console.log("Enabling wake word mode");
          setWakeWordMode(true);
          setWakeWordDetected(false);
          await startWakeWordDetection();
        } else {
          // Start direct STT recording
          console.log("Starting direct STT recording");
          await startSttRecording();
        }
      }
    } catch (err) {
      console.error("Error toggling voice input:", err);
      alert(`Error with voice input: ${err.message || err}`);
    }
  };

  // Determine the current status for UI display
  const getStatus = () => {
    if (wakeWordMode) {
      if (wakeWordDetected) {
        return "Listening...";
      } else {
        const wakeWord = builtInKeywords.includes(config.wakeWordModel) ? config.wakeWordModel : "Grapefruit";
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
            : wakeWordMode 
              ? "bg-green-500 hover:bg-green-600" 
              : isSttRecording 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-blue-500 hover:bg-blue-600"
        }`}
        title={
          !isSttLoaded || !isWakeWordLoaded 
            ? (initError || "Speech recognition not initialized") 
            : wakeWordMode 
              ? "Wake word mode active" 
              : isSttRecording 
                ? "Stop recording" 
                : "Start voice input"
        }
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
