import React, { useEffect, useState } from 'react';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { PorcupineWorker } from '@picovoice/porcupine-web-en-worker';
import { registerAudioCallback, unregisterAudioCallback, getAudioPlaybackState } from '../../utils/audioUtils';

const WakeWordListener = ({
  agent,
  onWakeWordDetected,
  isListening,
  accessKey,
}) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Handle audio playback state
  useEffect(() => {
    // Check initial state
    const { isPlaying } = getAudioPlaybackState();
    setIsAudioPlaying(isPlaying);

    const handleAudioStart = () => {
      setIsAudioPlaying(true);
    };

    const handleAudioEnd = () => {
      setIsAudioPlaying(false);
    };

    // Register callbacks
    registerAudioCallback('onPlaybackStart', handleAudioStart);
    registerAudioCallback('onPlaybackEnd', handleAudioEnd);

    // Cleanup
    return () => {
      unregisterAudioCallback('onPlaybackStart', handleAudioStart);
      unregisterAudioCallback('onPlaybackEnd', handleAudioEnd);
    };
  }, []);

  useEffect(() => {
    let porcupineWorker = null;

    const initializeWakeWord = async () => {
      try {
        // Don't start listening if audio is playing or if isListening is false
        if (!isListening || isAudioPlaying) {
          if (isAudioPlaying) {
            setStatus('audio_playing');
          } else {
            setStatus('idle');
          }
          return;
        }

        setStatus('initializing');
        setError(null);

        if (!accessKey) {
          throw new Error("Access key is required for wake word detection");
        }

        // Initialize based on agent's wakeword configuration
        if (!agent) {
          throw new Error("Agent configuration is required for wake word detection");
        }

        let keywords = [];
        if (agent.wakeword_type === 'default') {
          const builtInWakeword = agent.built_in_wakeword || 'Computer';
          
          // Use absolute URL for model path
          const modelPath = `${window.location.origin}/models/porcupine_params.pv`;
          
          keywords = [{ 
            builtin: builtInWakeword, 
            sensitivity: agent.wakeword_sensitivity || 0.5 
          }];
          
          porcupineWorker = await PorcupineWorker.build(
            accessKey,
            keywords,
            { modelPath: modelPath }
          );
        } else if (agent.wakeword_type === 'custom' && agent.wakeword_model_path) {
          // For custom models, we need to fetch the model file
          const modelResponse = await fetch(agent.wakeword_model_path);
          const modelBase64 = await modelResponse.text();
          
          if (!modelBase64) {
            throw new Error("Custom wake word model is empty");
          }
          
          // Use absolute URL for model path
          const modelPath = `${window.location.origin}/models/porcupine_params.pv`;
          
          porcupineWorker = await PorcupineWorker.build(
            accessKey,
            [{ custom: modelBase64, sensitivity: agent.wakeword_sensitivity || 0.5 }],
            { modelPath: modelPath }
          );
        } else {
          throw new Error('Invalid wakeword configuration');
        }

        // Subscribe to web voice processor
        try {
          await WebVoiceProcessor.subscribe(porcupineWorker);
        } catch (subscribeErr) {
          console.error("Error subscribing to WebVoiceProcessor:", subscribeErr);
          throw new Error(`WebVoiceProcessor error: ${subscribeErr.message}`);
        }
        
        porcupineWorker.onKeyword = (keywordLabel) => {
          onWakeWordDetected();
        };

        setStatus('listening');
      } catch (err) {
        console.error('Error initializing wakeword:', err);
        setError(err.message || "Unknown wake word initialization error");
        setStatus('error');
      }
    };

    initializeWakeWord();

    return () => {
      const cleanup = async () => {
        if (porcupineWorker) {
          try {
            await WebVoiceProcessor.unsubscribe(porcupineWorker);
            porcupineWorker.terminate();
          } catch (err) {
            console.error("Error during cleanup:", err);
          }
        }
      };
      cleanup();
    };
  }, [agent, isListening, accessKey, onWakeWordDetected, isAudioPlaying]);

  return (
    <div className="flex items-center space-x-2">
      {/* Status indicator */}
      <div className={`h-3 w-3 rounded-full ${
        status === 'listening' ? 'bg-green-500 animate-pulse' :
        status === 'initializing' ? 'bg-yellow-500' :
        status === 'error' ? 'bg-red-500' :
        status === 'audio_playing' ? 'bg-blue-500' :
        'bg-gray-500'
      }`} />
      
      {/* Status text */}
      <span className="text-sm text-gray-600">
        {status === 'listening' ? 'Listening for wakeword...' :
         status === 'initializing' ? 'Initializing wakeword...' :
         status === 'error' ? `Error: ${error}` :
         status === 'audio_playing' ? 'Paused during audio playback' :
         'Wakeword detection inactive'}
      </span>
    </div>
  );
};

export default WakeWordListener; 