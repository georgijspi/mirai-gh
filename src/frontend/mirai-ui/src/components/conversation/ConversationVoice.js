import React, { useState, useEffect, useRef } from 'react';
import { useLeopard } from '@picovoice/leopard-react';
import { usePorcupine } from '@picovoice/porcupine-react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { registerAudioCallback, unregisterAudioCallback } from '../../utils/audioUtils';

// Standard built-in keywords available in Picovoice
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

const ConversationVoice = ({ 
  onTranscription, 
  agent, 
  accessKey,
}) => {
  const [micEnabled, setMicEnabled] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [error, setError] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastTranscriptTimestamp, setLastTranscriptTimestamp] = useState(null);
  const [isListeningPaused, setIsListeningPaused] = useState(false);
  
  const recordingTimeoutRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastSoundDetectedRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationRef = useRef(null);
  const audioDataRef = useRef(new Uint8Array(128));
  const animationIntervalRef = useRef(null);
  const inactivityTimeoutRef = useRef(null);
  const absoluteMaxTimeoutRef = useRef(null);
  const lastTranscriptTimestampRef = useRef(null);
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

  // Initialize on mount
  useEffect(() => {
    if (!accessKey) {
      setError('No access key provided. Please configure your Picovoice access key in settings.');
      return;
    }

    // Do not try to initialize voice if agent is missing
    if (!agent) {
      setError('Missing agent configuration');
      return;
    }

    // Check if models are available by making HEAD requests
    const checkModelsAvailable = async () => {
      try {
        // Check leopard model
        const leopardModelPath = `${window.location.origin}/models/leopard_params.pv`;
        const leopardResponse = await fetch(leopardModelPath, { method: 'HEAD' });
        if (!leopardResponse.ok) {
          throw new Error(`Leopard model not available: ${leopardResponse.status}`);
        }
        
        // Check porcupine model
        const porcupineModelPath = `${window.location.origin}/models/porcupine_params.pv`;
        const porcupineResponse = await fetch(porcupineModelPath, { method: 'HEAD' });
        if (!porcupineResponse.ok) {
          throw new Error(`Porcupine model not available: ${porcupineResponse.status}`);
        }
        
        return { leopardModelPath, porcupineModelPath };
      } catch (error) {
        console.error("Error checking models:", error);
        throw error;
      }
    };

    const initialize = async () => {
      try {
        // First clean up any existing instances
        await cleanup();
        
        setError(null); // Clear any previous errors
        
        // Verify models are available
        const { leopardModelPath, porcupineModelPath } = await checkModelsAvailable();
        
        // Initialize STT
        try {
          await initStt(accessKey, {
            publicPath: leopardModelPath
          });
        } catch (sttErr) {
          throw new Error(`STT initialization error: ${sttErr.message}`);
        }

        // Initialize wake word detection
        try {
          // Get the wake word (default to computer if none or invalid)
          let wakeWord = agent.built_in_wakeword || "Computer";
          if (!builtInKeywords.includes(wakeWord)) {
            wakeWord = "Computer";
          }
          
          // Create keyword object
          const keyword = {
            builtin: wakeWord
          };
          
          await initWakeWord(accessKey, [keyword], {
            publicPath: porcupineModelPath
          });
          
        } catch (wakewordErr) {
          throw new Error(`Wake word initialization error: ${wakewordErr.message}`);
        }
        
        // If mic was enabled before, restart it
        if (micEnabled) {
          await startWakeWordDetection();
        }
      } catch (err) {
        console.error('Error initializing voice components:', err);
        setError(`Failed to initialize voice: ${err.message}`);
        setMicEnabled(false);
      }
    };

    initialize();

    return () => {
      cleanup();
    };
  }, [agent, accessKey]);

  // Register audio playback event handlers
  useEffect(() => {
    const handleAudioStart = () => {
      if (isWakeWordListening) {
        wasListeningBeforeAudioRef.current = true;
        stopWakeWordDetection().then(() => {
          setIsListeningPaused(true);
          setStatusMessage("Voice input paused during audio playback");
        }).catch(err => {
          console.error("Error stopping wake word detection:", err);
        });
      } else if (isSttRecording) {
        stopSttRecording().then(() => {
          setWakeWordDetected(false);
          setIsListeningPaused(true);
          setStatusMessage("Voice input paused during audio playback");
        }).catch(err => {
          console.error("Error stopping STT recording:", err);
        });
      }
    };

    const handleAudioEnd = () => {
      if (wasListeningBeforeAudioRef.current && micEnabled) {
        startWakeWordDetection().then(() => {
          wasListeningBeforeAudioRef.current = false;
          setIsListeningPaused(false);
          setStatusMessage("Listening for wake word resumed");
          
          // Clear status message after a short delay
          setTimeout(() => {
            setStatusMessage("");
          }, 2000);
        }).catch(err => {
          console.error("Error restarting wake word detection:", err);
        });
      } else {
        setIsListeningPaused(false);
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
  }, [micEnabled, isWakeWordListening, isSttRecording]);

  // Handle errors
  useEffect(() => {
    if (sttError) {
      setError(`Speech recognition error: ${sttError.message || sttError}`);
    }
    if (wakeWordError) {
      setError(`Wake word error: ${wakeWordError.message || wakeWordError}`);
    }
  }, [sttError, wakeWordError]);

  // Add clear transition messages for better user feedback
  const showTransitionMessage = (message, duration = 1500) => {
    setTransitioning(true);
    setStatusMessage(message);
    
    setTimeout(() => {
      setTransitioning(false);
      setStatusMessage('');
    }, duration);
  };

  // Handle wakeword detection with better visual feedback
  useEffect(() => {
    if (keywordDetection && micEnabled && isWakeWordListening) {
      showTransitionMessage(`Wake word "${keywordDetection.label}" detected! Listening for your message...`);
      handleWakewordDetected();
    }
  }, [keywordDetection]);

  // When STT recording starts, ensure we've fully initialized
  useEffect(() => {
    if (isSttRecording) {
      // Give a small delay for the STT system to fully initialize
      setTimeout(() => {
        startSilenceDetection();
        // Only setup timeout after a brief initialization period
        setTimeout(() => {
          setupInactivityTimeout();
        }, 500);
      }, 300);
    }
  }, [isSttRecording]);
  
  // Handle speech recognition results with clear visual feedback
  useEffect(() => {
    if (sttResult && sttResult.transcript) {
      const transcript = sttResult.transcript.trim();
      
      // Store the transcribed text for display
      setTranscribedText(transcript);
      
      // Reset the speech inactivity timer
      resetInactivityTimeout();
      
      // Only send non-empty transcriptions
      if (transcript !== "") {
        showTransitionMessage("Message received! Processing...");
        setIsSendingMessage(true);
        
        // Stop recording immediately to provide better feedback
        stopRecordingAndRestartWakeword().then(() => {
          // Send the transcription
          onTranscription(transcript);
          
          // Clear the transcribed text and sending state after a short delay
          setTimeout(() => {
            setTranscribedText('');
            setIsSendingMessage(false);
          }, 700);
        });
      } else {
        // Stop recording and restart wakeword without sending message
        showTransitionMessage("No message detected. Listening for wake word again...");
        stopRecordingAndRestartWakeword();
      }
    }
  }, [sttResult]);

  // Update audio visualization
  useEffect(() => {
    if (isSttRecording) {
      startAudioVisualization();
    } else {
      stopAudioVisualization();
    }
    
    return () => {
      stopAudioVisualization();
    };
  }, [isSttRecording]);

  const startAudioVisualization = async () => {
    try {
      // If we already have a running visualization, stop it first
      if (animationRef.current || animationIntervalRef.current) {
        stopAudioVisualization();
      }
      
      // Create a new AudioContext if needed
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Get microphone access if needed
      if (!mediaStreamRef.current) {
        try {
          mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (mediaErr) {
          console.error('Error accessing microphone:', mediaErr);
          return;
        }
      }
      
      // Create analyzer if needed
      if (!analyserRef.current) {
        try {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
          source.connect(analyserRef.current);
        } catch (analyzerErr) {
          console.error('Error creating audio analyzer:', analyzerErr);
          return;
        }
      }
      
      // Start the animation frame loop
      updateAudioVisualization();
      
      // Start an interval to sample audio levels for the circles
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      
      animationIntervalRef.current = setInterval(() => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average audio level (0-100)
          const average = Math.min(
            100, 
            (dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length) * 3
          );
          setAudioLevel(average);
        }
      }, 100);
    } catch (err) {
      console.error('Error starting audio visualization:', err);
      // Clean up any partial initialization
      stopAudioVisualization();
    }
  };

  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    
    setAudioLevel(0);
  };

  const updateAudioVisualization = () => {
    if (analyserRef.current && isSttRecording) {
      // Use the audio data to update visualization
      analyserRef.current.getByteFrequencyData(audioDataRef.current);
      
      // Schedule next frame
      animationRef.current = requestAnimationFrame(updateAudioVisualization);
    }
  };

  const cleanup = async () => {
    // Clear any timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (inactivityTimeoutRef.current) {
      clearInterval(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    if (absoluteMaxTimeoutRef.current) {
      clearTimeout(absoluteMaxTimeoutRef.current);
      absoluteMaxTimeoutRef.current = null;
    }
    
    // Stop animation
    stopAudioVisualization();

    // Stop audio processing
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Only close the AudioContext if it exists and is not already closed
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (err) {
        console.warn('Error closing AudioContext:', err);
      }
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    // Release speech components
    try {
      if (isSttRecording) {
        await stopSttRecording();
      }
      if (isWakeWordListening) {
        await stopWakeWordDetection();
      }
      // Only release if loaded
      if (isSttLoaded) {
        await releaseStt();
      }
      if (isWakeWordLoaded) {
        await releaseWakeWord();
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  };

  // Setup inactivity timeout to detect when no speech is being transcribed
  const setupInactivityTimeout = () => {
    // Clear any existing timeouts
    if (inactivityTimeoutRef.current) {
      clearInterval(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    
    // Simple timestamp tracking for last speech activity
    lastTranscriptTimestampRef.current = Date.now();
    
    // Start a simple interval to check for inactivity
    inactivityTimeoutRef.current = setInterval(() => {
      // Check if we're actually recording
      const actuallyRecording = isSttRecording;
      const now = Date.now();
      const elapsed = now - lastTranscriptTimestampRef.current;
      
      // If more than 3 seconds without speech activity, stop recording
      if (elapsed > 3000 && actuallyRecording) {
        // Stop the interval immediately to prevent multiple triggers
        clearInterval(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
        
        showTransitionMessage("No speech detected for 3 seconds, stopping...");
        stopRecordingAndRestartWakeword();
      }
    }, 500);
    
    // Also set an absolute maximum recording time (30 seconds)
    if (absoluteMaxTimeoutRef.current) {
      clearTimeout(absoluteMaxTimeoutRef.current);
      absoluteMaxTimeoutRef.current = null;
    }
    
    absoluteMaxTimeoutRef.current = setTimeout(() => {
      showTransitionMessage("Maximum recording time reached");
      stopRecordingAndRestartWakeword();
    }, 30000);
  };

  // Reset inactivity timeout when speech is detected
  const resetInactivityTimeout = () => {
    const oldTimestamp = lastTranscriptTimestampRef.current;
    lastTranscriptTimestampRef.current = Date.now();
  };

  const handleWakewordDetected = async () => {
    try {
      // Stop wakeword detection
      await stopWakeWordDetection();
      setWakeWordDetected(true);
      
      // Start speech recognition
      await startSttRecording();
    } catch (err) {
      console.error('Error handling wakeword detection:', err);
      setError(`Error: ${err.message}`);
      setWakeWordDetected(false);
      try {
        await startWakeWordDetection();
      } catch (startErr) {
        console.error('Failed to restart wake word detection:', startErr);
      }
    }
  };

  const startSilenceDetection = async () => {
    try {
      // Initialize audio processing for silence detection
      if (audioContextRef.current) {
        try {
          // First close any existing audio context if it's not already closed
          if (audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close();
          }
          audioContextRef.current = null;
          analyserRef.current = null;
        } catch (closeErr) {
          console.warn('Error closing previous audio context:', closeErr);
        }
      }
      
      // Create fresh audio processing
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Get microphone stream
      if (mediaStreamRef.current) {
        // Close any existing media stream
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      source.connect(analyserRef.current);
      
      // Start checking for silence
      lastSoundDetectedRef.current = Date.now();
      checkSilence();
      
      // Also start visualization
      startAudioVisualization();
    } catch (err) {
      console.error('Error starting silence detection:', err);
    }
  };

  const checkSilence = () => {
    if (!analyserRef.current || !audioContextRef.current) {
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    
    // If volume is above threshold, update last sound detected time AND reset inactivity timer
    if (average > 15) { // Threshold for background noise
      lastSoundDetectedRef.current = Date.now();
      resetInactivityTimeout(); // Reset STT inactivity timer based on audio level
    }
    
    // Continue checking for silence if still recording
    if (isSttRecording) {
      silenceTimeoutRef.current = setTimeout(checkSilence, 200);
    }
  };

  const stopRecordingAndRestartWakeword = async () => {
    try {
      // Clear timeouts
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (inactivityTimeoutRef.current) {
        clearInterval(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      if (absoluteMaxTimeoutRef.current) {
        clearTimeout(absoluteMaxTimeoutRef.current);
        absoluteMaxTimeoutRef.current = null;
      }
      
      // Stop animations
      stopAudioVisualization();
      
      // Stop audio processing
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      // Only close the AudioContext if it exists and is not already closed
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          await audioContextRef.current.close();
        } catch (err) {
          console.warn('Error closing AudioContext:', err);
        }
        audioContextRef.current = null;
        analyserRef.current = null;
      }
      
      // Stop STT recording
      if (isSttRecording) {
        await stopSttRecording();
      }
      
      // Reset state and restart wakeword detection
      setWakeWordDetected(false);
      
      // Ensure we don't try to restart wake word detection if we're stopping the microphone
      if (micEnabled) {
        await startWakeWordDetection();
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError(`Error stopping recording: ${err.message}`);
    }
  };

  const toggleMicrophone = async () => {
    try {
      if (micEnabled) {
        // Turn off microphone
        showTransitionMessage("Voice input disabled");
        setMicEnabled(false);
        await stopRecordingAndRestartWakeword();
        if (isWakeWordListening) {
          await stopWakeWordDetection();
        }
      } else {
        // Turn on microphone and start listening for wakeword
        showTransitionMessage(`Listening for wake word "${agent?.built_in_wakeword || 'Computer'}"...`);
        setMicEnabled(true);
        setWakeWordDetected(false);
        await startWakeWordDetection();
      }
    } catch (err) {
      console.error('Error toggling microphone:', err);
      setError(`Error toggling microphone: ${err.message}`);
    }
  };

  // Status text display
  const getStatusText = () => {
    if (transitioning) {
      return statusMessage;
    }
    
    if (!accessKey) return (
      <span>
        Access key required - 
        <a href="/settings" className="text-blue-400 hover:underline ml-1">
          Configure in Settings
        </a>
      </span>
    );
    if (error) return error;
    if (!isSttLoaded || !isWakeWordLoaded) return "Initializing...";
    
    if (isListeningPaused) return "Voice input paused during audio playback";
    if (isSendingMessage) return "Sending message...";
    if (transcribedText) return `"${transcribedText}"`;
    
    if (micEnabled) {
      if (wakeWordDetected) return `Recording... (speak now)`;
      return `Listening for wake word "${agent?.built_in_wakeword || 'Computer'}"...`;
    }
    
    return "Click to enable voice";
  };

  // Mic button animation classes
  const getMicButtonClasses = () => {
    const baseClasses = "p-3 rounded-full flex items-center justify-center transition-all relative z-10";
    
    // Disabled state
    if (!isSttLoaded || !isWakeWordLoaded || !accessKey || transitioning) {
      return `${baseClasses} bg-gray-600 cursor-not-allowed opacity-50`;
    }
    
    // Sending message state
    if (isSendingMessage) {
      return `${baseClasses} bg-blue-500 pulse-animation`;
    }
    
    // Wake word detected state (recording)
    if (micEnabled && wakeWordDetected) {
      return `${baseClasses} bg-red-500 hover:bg-red-600 scale-animation`;
    }
    
    // Wake word listening state
    if (micEnabled) {
      return `${baseClasses} bg-green-500 hover:bg-green-600 slow-pulse-animation`;
    }
    
    // Idle state
    return `${baseClasses} bg-blue-500 hover:bg-blue-600`;
  };

  // Listen for speech input
  useEffect(() => {
    if (isSttRecording && sttResult) {
      resetInactivityTimeout();
    }
  }, [isSttRecording, sttResult]);

  return (
    <div className="flex flex-col items-center justify-center w-full my-4">
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes slowPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scale {
          0% { transform: scale(1); }
          10% { transform: scale(1.1); }
          20% { transform: scale(1); }
          30% { transform: scale(1.1); }
          40% { transform: scale(1); }
          100% { transform: scale(1); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes flashTransition {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        .pulse-animation {
          animation: pulse 1s infinite;
        }
        .slow-pulse-animation {
          animation: slowPulse 2s infinite;
        }
        .scale-animation {
          animation: scale 2s infinite;
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .flash-transition {
          animation: flashTransition 0.8s;
        }
        .audio-circle {
          position: absolute;
          border-radius: 50%;
          background: transparent;
          border: 2px solid;
          transform-origin: center;
          transition: all 0.2s ease-out;
          opacity: 0.7;
          pointer-events: none;
        }
        .status-message {
          min-height: 1.5rem;
          transition: all 0.3s ease;
        }
      `}</style>
      
      <div className="relative h-20 w-20 flex items-center justify-center">
        {/* Visual transition effect for mode changes */}
        {transitioning && (
          <div 
            className="absolute inset-0 rounded-full flash-transition" 
            style={{ zIndex: 5 }}
          />
        )}
        
        {/* Audio circles */}
        {isSttRecording && [0.6, 0.75, 0.9].map((scale, index) => {
          const dynamicScale = audioLevel > 0 
            ? scale + (audioLevel / 1000) 
            : scale;
          
          const delay = index * 0.1;
          const size = 60 + (index * 5);
          
          return (
            <div 
              key={index}
              className="audio-circle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderColor: `rgba(255, ${100 + (index * 50)}, ${100 + (index * 50)}, 0.6)`,
                transform: `scale(${dynamicScale})`,
                transition: `all 0.3s ease-out ${delay}s`,
                opacity: isSttRecording ? 0.7 - (index * 0.15) : 0
              }}
            />
          );
        })}
        
        {/* Main microphone button */}
        <button
          onClick={toggleMicrophone}
          disabled={!isSttLoaded || !isWakeWordLoaded || !accessKey || transitioning}
          className={getMicButtonClasses()}
          title={
            !isSttLoaded || !isWakeWordLoaded || !accessKey
              ? error || "Speech recognition not initialized"
              : micEnabled
                ? wakeWordDetected
                  ? "Recording in progress"
                  : `Listening for wake word "${agent?.built_in_wakeword || 'Computer'}"`
                : "Enable voice input"
          }
        >
          {micEnabled && wakeWordDetected ? (
            <FaMicrophone size={24} className="text-white animate-pulse" />
          ) : (
            <FaMicrophoneSlash size={24} className="text-white" />
          )}
        </button>
      </div>
      
      {/* Status text display with animation */}
      <div className="mt-2 text-sm text-center status-message">
        <span 
          className={`
            ${transitioning ? 'text-yellow-400 font-medium fade-in' : 
              isSendingMessage ? 'text-blue-400' : 'text-gray-400'} 
            transition-colors
          `}
        >
          {getStatusText()}
        </span>
      </div>
      
      {/* Transcribed text preview */}
      {transcribedText && !isSendingMessage && (
        <div className="mt-1 text-xs text-green-400 max-w-xs text-center fade-in">
          "{transcribedText}"
        </div>
      )}
    </div>
  );
};

export default ConversationVoice; 