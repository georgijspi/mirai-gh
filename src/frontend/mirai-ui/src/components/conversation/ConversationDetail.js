import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  Avatar,
  CircularProgress,
  InputAdornment,
  AppBar,
  Toolbar,
  InputBase,
  styled
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { playMessageAudio, stopCurrentAudio, pauseCurrentAudio, resumeCurrentAudio, getAudioPlaybackState } from "../../utils/audioUtils";
import {
  fetchConversationById,
  sendMessage as sendMessageService,
  updateConversation,
  rateMessage,
} from "../../services/conversationService";
import { fetchAgentByUid } from "../../services/agentService";
import { streamSpeech } from "../../services/ttsService";
import websocketService from "../../services/websocketService";
import ConversationVoice from "./ConversationVoice";
import { getPicovoiceAccessKey } from '../../services/settingsService';
import { API_BASE_URL } from "../../config/apiConfig";

// Create a custom CSS class for the bounce animation for rating icons
const bounceAnimation = {
  animation: 'bounce 0.5s',
};

// Create a keyframes style for the bounce animation
const keyframes = `
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: scale(1);}
  40% {transform: scale(1.3);}
  60% {transform: scale(1.15);}
}
`;

// Styled components
const MessageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  overflowY: 'auto',
  height: 'calc(100% - 64px - 90px)', // Subtract header height and input area height
  flexGrow: 0, // Don't let it grow beyond its height
  flexShrink: 1, // Allow it to shrink
}));

const MessageInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 20,
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
    }
  }
}));

const ConversationDetail = ({ conversationId, onBack, isMobile = false }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [agent, setAgent] = useState(null);
  const [accessKey, setAccessKey] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const titleInputRef = useRef(null);
  const wsEndpoint = useRef(`conversation/${conversationId}`);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [ratingStates, setRatingStates] = useState({});
  const [ratingLoading, setRatingLoading] = useState({});
  const [animatingRatings, setAnimatingRatings] = useState({});

  // Define setupWebSocket as a callback to avoid circular dependency
  const setupWebSocket = useCallback(() => {
    if (!conversationId) {
      console.warn("Cannot setup WebSocket without conversation ID");
      return;
    }

    try {
      wsEndpoint.current = `conversation/${conversationId}`;
      console.log(`Setting up WebSocket for endpoint: ${wsEndpoint.current}`);
      websocketService.disconnect(wsEndpoint.current); // Disconnect any existing connection first
      websocketService.connect(wsEndpoint.current, handleWebSocketMessage);
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      setError(
        "WebSocket connection failed. Messages will not update in real-time."
      );
    }
  }, [conversationId]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log("WebSocket message received:", data);

    if (data && data.type === "agent_response" && data.message) {
      // Add the agent message to the chat if it's not already there
      setMessages((prev) => {
        // Avoid adding duplicate messages
        if (prev.some((m) => m.message_uid === data.message.message_uid)) {
          return prev;
        }

        const updatedMessages = [...prev, data.message];

        // Initialize rating state for the new message
        setRatingStates(prevRatings => ({
          ...prevRatings,
          [data.message.message_uid]: data.message.rating || 'none'
        }));

        // Play the audio if available
        if (data.message.audio_stream_url) {
          setTimeout(() => {
            handlePlayAudio(data.message);
          }, 500);
        }

        return updatedMessages;
      });
    }
  };

  // Load conversation, agent and access key on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch conversation details
        setLoading(true);
        const response = await fetchConversationById(conversationId);
        setConversation(response);
        setTitleInput(response.title || "Conversation");
        setMessages(response.messages || []);
        
        // Initialize rating states from loaded messages
        const initialRatingStates = {};
        response.messages?.forEach(message => {
          if (message.message_type === 'agent' && message.message_uid) {
            initialRatingStates[message.message_uid] = message.rating || 'none';
          }
        });
        setRatingStates(initialRatingStates);

        // Fetch agent details
        if (response.agent_uid) {
          try {
            const agentData = await fetchAgentByUid(response.agent_uid);
            if (!agentData) {
              console.error("No agent data returned");
              setError("Failed to load agent data - agent not found");
            } else {
              console.log("Agent data loaded:", agentData);
              // Ensure agent has required fields for voice functionality
              if (!agentData.wakeword_type) {
                agentData.wakeword_type = 'default';
              }
              if (!agentData.built_in_wakeword) {
                agentData.built_in_wakeword = 'Computer';
              }
              setAgent(agentData);
            }
          } catch (agentError) {
            console.error("Error fetching agent:", agentError);
            setError("Failed to load agent data");
          }
        } else {
          console.warn("No agent_uid in conversation data");
          setError("Conversation has no associated agent");
        }

        // Setup WebSocket
        setupWebSocket();

        // Load access key from backend
        const key = await getPicovoiceAccessKey();
        console.log("ConversationDetail: Fetched access key from server:", key ? "Present" : "Missing");
        if (key) {
          console.log("Access key loaded from server");
          setAccessKey(key);
        } else {
          console.warn("No access key found on server");
          setError("No Picovoice access key found. Please configure one in Settings.");
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        setError("Failed to load conversation");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup
    return () => {
      websocketService.disconnect(wsEndpoint.current);
    };
  }, [conversationId, setupWebSocket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus title input when editing mode is activated
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTitle]);

  const sendMessage = async (content) => {
    // Use the passed content or the input state
    const messageText = content || input;
    
    if (messageText.trim() === "") return;

    try {
      setSending(true);

      // Add user message to UI immediately
      const userMessage = {
        content: messageText,
        message_type: "user",
        conversation_uid: conversationId,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Clear input if we're using the text input
      if (!content) {
      setInput("");
      }

      await sendMessageService({
        content: messageText,
        conversation_uid: conversationId,
      });

      console.log("Message sent successfully");
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Check if audio is playing and update UI state
  useEffect(() => {
    const checkAudioState = () => {
      const { isPlaying, isPaused: audioPaused } = getAudioPlaybackState();
      if (!isPlaying && !audioPaused) {
        setPlayingAudioId(null);
        setIsPaused(false);
      } else if (audioPaused) {
        setIsPaused(true);
      }
    };
    
    // Set up event listeners for audio playback
    const handlePlaybackStart = () => {
      // The actual message ID is set when handlePlayAudio is called
      setIsPaused(false);
    };
    
    const handlePlaybackEnd = () => {
      const { isPaused: audioPaused } = getAudioPlaybackState();
      if (!audioPaused) {
        setPlayingAudioId(null);
      }
      setIsPaused(audioPaused);
    };
    
    const handlePlaybackPaused = () => {
      setIsPaused(true);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('audioPlaybackStart', handlePlaybackStart);
      window.addEventListener('audioPlaybackEnd', handlePlaybackEnd);
      window.addEventListener('audioPlaybackPaused', handlePlaybackPaused);
    }
    
    // Check audio state periodically
    const interval = setInterval(checkAudioState, 1000);
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('audioPlaybackStart', handlePlaybackStart);
        window.removeEventListener('audioPlaybackEnd', handlePlaybackEnd);
        window.removeEventListener('audioPlaybackPaused', handlePlaybackPaused);
      }
      clearInterval(interval);
    };
  }, []);

  // Handle audio playback control (play/pause/stop)
  const handleAudioControl = (message, action) => {
    const messageId = message.message_uid;
    
    if (action === 'play') {
      if (playingAudioId === messageId) {
        // If this message is already playing
        if (isPaused) {
          // If paused, resume playback
          resumeCurrentAudio();
          setIsPaused(false);
        } else {
          // If playing, pause it
          pauseCurrentAudio();
          setIsPaused(true);
        }
      } else {
        // Only try to play if we have a message ID
        if (!messageId) {
          console.warn("No audio available for this message");
          return;
        }
        
        // Signal audio playback is about to start
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('audioPlaybackPending');
          window.dispatchEvent(event);
        }
        
        // Play the audio for this message
        streamSpeech(messageId, conversationId)
          .then((response) => response.blob())
          .then((audioBlob) => {
            const audioUrl = URL.createObjectURL(audioBlob);
            playMessageAudio(audioUrl);
            setPlayingAudioId(messageId);
            setIsPaused(false);
          })
          .catch((error) => {
            console.error("Error streaming audio:", error);
            setPlayingAudioId(null);
            setIsPaused(false);
            // Signal audio playback failed
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('audioPlaybackFailed');
              window.dispatchEvent(event);
            }
          });
      }
    } else if (action === 'pause') {
      pauseCurrentAudio();
      setIsPaused(true);
    } else if (action === 'resume') {
      resumeCurrentAudio();
      setIsPaused(false);
    } else if (action === 'stop') {
      stopCurrentAudio();
      setPlayingAudioId(null);
      setIsPaused(false);
    }
  };

  // Replace the existing handlePlayAudio with our new function
  const handlePlayAudio = (message) => {
    handleAudioControl(message, 'play');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading && !conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-xl">Loading conversation...</div>
      </div>
    );
  }

  const handleVoiceTranscription = (transcription) => {
    if (transcription.trim() === "") return;

    // Send the transcribed message
    sendMessage(transcription);
  };

  // Handle title edit start
  const handleTitleClick = () => {
    setEditingTitle(true);
  };

  // Handle title save
  const handleTitleSave = async () => {
    if (!titleInput.trim()) {
      setTitleInput(conversation.title || "Conversation");
      setEditingTitle(false);
      return;
    }

    if (titleInput === conversation.title) {
      setEditingTitle(false);
      return;
    }

    try {
      setSavingTitle(true);
      const updatedConversation = await updateConversation(conversationId, {
        title: titleInput.trim()
      });
      
      if (updatedConversation) {
        setConversation(prev => ({
          ...prev,
          title: titleInput.trim()
        }));
      }
    } catch (error) {
      console.error("Error updating conversation title:", error);
      setError("Failed to update title");
      setTitleInput(conversation.title || "Conversation");
    } finally {
      setSavingTitle(false);
      setEditingTitle(false);
    }
  };

  // Handle title input key events
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleInput(conversation?.title || "Conversation");
      setEditingTitle(false);
    }
  };

  // Handle message rating (like/dislike)
  const handleRateMessage = async (messageId, rating) => {
    // Don't allow rating if already in progress
    if (ratingLoading[messageId]) return;

    try {
      // Set loading state for this specific message
      setRatingLoading(prev => ({ ...prev, [messageId]: true }));
      
      // If user clicks the same rating again, treat it as removing the rating
      const newRating = ratingStates[messageId] === rating ? 'none' : rating;
      
      // Update local state immediately for better UX
      setRatingStates(prev => ({
        ...prev,
        [messageId]: newRating
      }));
      
      // Set animating state if this is a new rating
      if (newRating !== 'none') {
        setAnimatingRatings(prev => ({
          ...prev, 
          [messageId]: newRating
        }));
        
        // Clear animation after it completes
        setTimeout(() => {
          setAnimatingRatings(prev => {
            const updated = { ...prev };
            delete updated[messageId];
            return updated;
          });
        }, 500); // Animation duration
      }
      
      // Call API to rate the message
      await rateMessage({
        message_uid: messageId,
        rating: newRating
      });
      
    } catch (error) {
      console.error("Error rating message:", error);
      // Revert the rating in case of an error
      setRatingStates(prev => ({
        ...prev,
        [messageId]: prev[messageId] || 'none'
      }));
      setError(`Failed to rate message: ${error.message}`);
    } finally {
      // Clear loading state
      setRatingLoading(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // Render a chat message
  const renderMessage = (message, index) => {
    const isAgent = message.message_type === 'agent';
    const hasAudio = isAgent; // Agent messages should always have the potential for audio
    const isPlaying = playingAudioId === message.message_uid;
    const currentRating = ratingStates[message.message_uid] || 'none';
    const isRatingLoading = ratingLoading[message.message_uid] || false;
    const isAnimating = animatingRatings[message.message_uid] || false;

    return (
      <Box
        key={message.message_uid || index}
        ref={index === messages.length - 1 ? messagesEndRef : null}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isAgent ? 'flex-start' : 'flex-end',
          mb: 2,
          maxWidth: '90%',
          alignSelf: isAgent ? 'flex-start' : 'flex-end',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 0.5 }}>
          {isAgent && agent && (
            <Avatar 
              src={agent.profile_picture_url || (agent.profile_picture_path ? `${API_BASE_URL}${agent.profile_picture_path}` : undefined)}
              alt={agent.name}
              sx={{ 
                width: 32, 
                height: 32, 
                mr: 1,
                bgcolor: 'primary.dark',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}
            >
              {agent.name ? agent.name.charAt(0).toUpperCase() : 'A'}
            </Avatar>
          )}
          
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              maxWidth: '85%',
              backgroundColor: isAgent 
                ? 'rgba(90, 90, 90, 0.5)' 
                : 'rgba(25, 118, 210, 0.75)',
              borderTopLeftRadius: isAgent ? 0 : undefined,
              borderTopRightRadius: !isAgent ? 0 : undefined,
              position: 'relative',
              wordBreak: 'break-word',
              // Removed animation style from here
            }}
          >
            <Typography variant="body1" component="div" color="text.primary">
              {message.content}
            </Typography>
          </Paper>
          
          {/* Spacer for symmetry */}
          {!isAgent && (
            <Box sx={{ width: 32, height: 32, ml: 1 }} />
          )}
        </Box>
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: isAgent ? 'flex-start' : 'flex-end',
            pl: isAgent ? 5 : 0,
            pr: isAgent ? 0 : 5,
            mt: 0.5
          }}
        >
          {/* Audio controls for agent messages */}
          {isAgent && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              {isPlaying ? (
                <>
                  {isPaused ? (
                    <IconButton 
                      size="small" 
                      onClick={() => handleAudioControl(message, 'resume')}
                      color="primary"
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton 
                      size="small" 
                      onClick={() => handleAudioControl(message, 'pause')}
                      color="primary"
                    >
                      <PauseIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton 
                    size="small" 
                    onClick={() => handleAudioControl(message, 'stop')}
                    color="primary"
                  >
                    <StopIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <IconButton 
                  size="small" 
                  onClick={() => handlePlayAudio(message)}
                  color="primary"
                >
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
          
          {/* Message timestamp */}
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: '0.7rem' }}
          >
            {formatTime(message.created_at)}
          </Typography>
          
          {/* Rating controls for agent messages */}
          {isAgent && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                ml: 2
              }}
            >
              {isRatingLoading ? (
                <CircularProgress size={16} />
              ) : (
                <>
                  <IconButton 
                    onClick={() => handleRateMessage(message.message_uid, 'like')}
                    color={currentRating === 'like' ? 'success' : 'default'}
                    size="small"
                    disabled={isRatingLoading}
                    sx={{ 
                      p: 0.5,
                      ...(isAnimating && currentRating === 'like' ? bounceAnimation : {})
                    }}
                  >
                    <ThumbUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleRateMessage(message.message_uid, 'dislike')}
                    color={currentRating === 'dislike' ? 'error' : 'default'}
                    size="small"
                    disabled={isRatingLoading}
                    sx={{ 
                      p: 0.5,
                      ...(isAnimating && currentRating === 'dislike' ? bounceAnimation : {})
                    }}
                  >
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        bgcolor: 'background.default',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <AppBar 
        position="static" 
        color="transparent" 
        elevation={0}
        sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={onBack}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          
          {editingTitle ? (
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <InputBase 
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                fullWidth
                sx={{ ml: 2 }}
                inputRef={titleInputRef}
              />
              {savingTitle ? (
                <CircularProgress size={24} sx={{ mx: 1 }} />
              ) : (
                <>
                  <IconButton onClick={handleTitleSave} color="primary">
                    <CheckIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => {
                      setEditingTitle(false);
                      setTitleInput(conversation?.title || 'Conversation');
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </>
              )}
            </Box>
          ) : (
            <>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {loading ? 'Loading...' : conversation?.title || 'Conversation'}
              </Typography>
              <IconButton
                color="inherit"
                onClick={handleTitleClick}
              >
                <EditIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <MessageContainer ref={messageContainerRef}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              No messages yet. Start a conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        <div ref={messagesEndRef} />
      </MessageContainer>
      
      {/* Error message */}
      {error && (
        <Box sx={{ p: 2, bgcolor: 'error.dark', flexShrink: 0 }}>
          <Typography color="white">{error}</Typography>
        </Box>
      )}

      {/* Input area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MessageInput
            fullWidth
            placeholder="Type a message..."
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || !agent}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    onClick={() => sendMessage()}
                    disabled={sending || input.trim() === ''}
                  >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            variant="outlined"
          />
        </Box>
        
        {agent && (
          <Box sx={{ mt: 1 }}>
            <ConversationVoice
              agent={agent}
              accessKey={accessKey}
              onTranscription={handleVoiceTranscription}
            />
          </Box>
        )}
      </Box>
      
      {/* Add the CSS keyframes */}
      <style>{keyframes}</style>
    </Box>
  );
};

export default ConversationDetail;
