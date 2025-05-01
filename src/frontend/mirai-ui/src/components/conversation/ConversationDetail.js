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
  styled,
} from "@mui/material";
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
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  playMessageAudio,
  stopCurrentAudio,
  pauseCurrentAudio,
  resumeCurrentAudio,
  getAudioPlaybackState,
} from "../../utils/audioUtils";
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
import { getPicovoiceAccessKey } from "../../services/settingsService";
import { API_BASE_URL } from "../../config/apiConfig";

// Create a custom CSS class for the bounce animation for rating icons
const bounceAnimation = {
  animation: "bounce 0.5s",
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
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2),
  overflowY: "auto",
  height: "100%",
  width: "100%",
  maxWidth: "100%",
}));

const MessageScrollArea = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  marginTop: "auto",
}));

const MessageInput = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 20,
    backgroundColor: theme.palette.background.paper,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    "&.Mui-focused": {
      backgroundColor: theme.palette.background.paper,
    },
  },
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
      setMessages((prev) => {
        if (prev.some((m) => m.message_uid === data.message.message_uid)) {
          return prev;
        }

        const updatedMessages = [...prev, data.message];

        setRatingStates((prevRatings) => ({
          ...prevRatings,
          [data.message.message_uid]: data.message.rating || "none",
        }));

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
        response.messages?.forEach((message) => {
          if (message.message_type === "agent" && message.message_uid) {
            initialRatingStates[message.message_uid] = message.rating || "none";
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
                agentData.wakeword_type = "default";
              }
              if (!agentData.built_in_wakeword) {
                agentData.built_in_wakeword = "Computer";
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
        console.log(
          "ConversationDetail: Fetched access key from server:",
          key ? "Present" : "Missing"
        );
        if (key) {
          console.log("Access key loaded from server");
          setAccessKey(key);
        } else {
          console.warn("No access key found on server");
          setError(
            "No Picovoice access key found. Please configure one in Settings."
          );
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

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading]);

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
      const audioState = getAudioPlaybackState();
      setPlayingAudioId(audioState.currentAudioId);
      setIsPaused(audioState.isPaused);
    };

    checkAudioState();

    const intervalId = setInterval(checkAudioState, 500);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handlePlaybackStart = () => {
      const audioState = getAudioPlaybackState();
      setPlayingAudioId(audioState.currentAudioId);
      setIsPaused(false);
    };

    const handlePlaybackEnd = () => {
      setIsPaused(false);
      // We don't reset playingAudioId here to keep the UI controls visible
    };

    const handlePlaybackPaused = () => {
      setIsPaused(true);
    };

    window.addEventListener("audioPlaybackStart", handlePlaybackStart);
    window.addEventListener("audioPlaybackEnd", handlePlaybackEnd);
    window.addEventListener("audioPlaybackPaused", handlePlaybackPaused);

    return () => {
      window.removeEventListener("audioPlaybackStart", handlePlaybackStart);
      window.removeEventListener("audioPlaybackEnd", handlePlaybackEnd);
      window.removeEventListener("audioPlaybackPaused", handlePlaybackPaused);
    };
  }, []);

  const handleAudioControl = (message, action) => {
    if (!message || !message.message_uid) {
      return;
    }

    if (playingAudioId === message.message_uid) {
      if (action === "toggle") {
        if (isPaused) {
          resumeCurrentAudio();
        } else {
          pauseCurrentAudio();
        }
      } else if (action === "stop") {
        stopCurrentAudio();
        setPlayingAudioId(null);
      }
    } else {
      if (message.message_uid) {
        if (playingAudioId) {
          stopCurrentAudio();
        }

        let audioUrl;
        
        if (message.audio_stream_url) {
          audioUrl = message.audio_stream_url;
        } else if (message.message_uid && conversation) {
          audioUrl = `${API_BASE_URL}/tts/stream/${message.message_uid}?conversation_uid=${conversation.conversation_uid}`;
        } else {
          console.error("Cannot play audio: Missing message_uid or conversation_uid");
          return;
        }

        dispatchAudioEvent("customAudioPlayback", {
          messageId: message.message_uid,
        });
        
        playMessageAudio(audioUrl, message.message_uid);
      }
    }
  };

  const dispatchAudioEvent = (eventName, data) => {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
  };

  const handlePlayAudio = (message) => {
    handleAudioControl(message, "toggle");
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
        title: titleInput.trim(),
      });

      if (updatedConversation) {
        setConversation((prev) => ({
          ...prev,
          title: titleInput.trim(),
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
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitleInput(conversation?.title || "Conversation");
      setEditingTitle(false);
    }
  };

  // Handle message rating (like/dislike)
  const handleRateMessage = async (messageId, rating) => {
    if (ratingLoading[messageId]) {
      return;
    }

    setRatingLoading((prev) => ({ ...prev, [messageId]: true }));

    const newRating = ratingStates[messageId] === rating ? "none" : rating;

    setRatingStates((prev) => ({
      ...prev,
      [messageId]: newRating,
    }));

    if (newRating !== "none") {
      setAnimatingRatings((prev) => ({
        ...prev,
        [messageId]: true,
      }));

      setTimeout(() => {
        setAnimatingRatings((prev) => ({
          ...prev,
          [messageId]: false,
        }));
      }, 500);
    }

    try {
      await rateMessage(conversationId, messageId, newRating);
    } catch (error) {
      console.error("Error rating message:", error);

      setRatingStates((prev) => ({
        ...prev,
        [messageId]: ratingStates[messageId] || "none",
      }));
    } finally {
      setRatingLoading((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  // Render a chat message
  const renderMessage = (message, index) => {
    const isAgent = message.message_type === "agent";
    const hasAudio = isAgent;
    const isCurrentlyPlaying = message.message_uid === playingAudioId;
    const messageDate = message.timestamp
      ? new Date(message.timestamp)
      : new Date();

    return (
      <Box
        key={message.message_uid || index}
        sx={{
          display: "flex",
          flexDirection: isAgent ? "row" : "row-reverse",
          mb: 2,
          alignItems: "flex-start",
        }}
      >
        <Avatar
          src={isAgent && agent?.profile_picture_path ? `${API_BASE_URL}/agent/${agent.agent_uid}/profile-picture` : undefined}
          sx={{
            bgcolor: isAgent ? "primary.main" : "secondary.main",
            width: 40,
            height: 40,
            mr: isAgent ? 1 : 0,
            ml: isAgent ? 0 : 1,
          }}
        >
          {isAgent
            ? agent?.name?.charAt(0).toUpperCase() || "A"
            : "U"}
        </Avatar>

        <Box
          sx={{
            maxWidth: "75%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Paper
            sx={{
              p: 2,
              bgcolor: isAgent ? "background.paper" : "primary.light",
              color: isAgent ? "text.primary" : "primary.contrastText",
              borderRadius: 2,
              position: "relative",
            }}
          >
            <Typography variant="body1" component="div" sx={{ overflowWrap: "break-word", whiteSpace: "pre-wrap" }}>
              {message.content}
            </Typography>

            {hasAudio && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 1,
                  gap: 1,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleAudioControl(message, "toggle")}
                  color={isCurrentlyPlaying ? "primary" : "default"}
                >
                  {isCurrentlyPlaying && !isPaused ? (
                    <PauseIcon fontSize="small" />
                  ) : (
                    <PlayArrowIcon fontSize="small" />
                  )}
                </IconButton>

                {isCurrentlyPlaying && (
                  <IconButton
                    size="small"
                    onClick={() => handleAudioControl(message, "stop")}
                  >
                    <StopIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}

            {isAgent && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  mt: 1,
                  gap: 1,
                }}
              >
                <IconButton
                  size="small"
                  color={ratingStates[message.message_uid] === "like" ? "success" : "default"}
                  onClick={() => handleRateMessage(message.message_uid, "like")}
                  disabled={ratingLoading[message.message_uid]}
                  sx={{
                    ...(animatingRatings[message.message_uid] && 
                      ratingStates[message.message_uid] === "like" 
                      ? bounceAnimation 
                      : {})
                  }}
                >
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color={ratingStates[message.message_uid] === "dislike" ? "error" : "default"}
                  onClick={() => handleRateMessage(message.message_uid, "dislike")}
                  disabled={ratingLoading[message.message_uid]}
                  sx={{
                    ...(animatingRatings[message.message_uid] && 
                      ratingStates[message.message_uid] === "dislike" 
                      ? bounceAnimation 
                      : {})
                  }}
                >
                  <ThumbDownIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Paper>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              alignSelf: isAgent ? "flex-start" : "flex-end",
              mt: 0.5,
            }}
          >
            {formatTime(message.timestamp)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "100vh",
        width: "100%",
        position: "relative",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      {/* Header - fixed height */}
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          height: "64px", // Keep header height fixed
          zIndex: 10,
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
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
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
                      setTitleInput(conversation?.title || "Conversation");
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
                {loading ? "Loading..." : conversation?.title || "Conversation"}
              </Typography>
              <IconButton color="inherit" onClick={handleTitleClick}>
                <EditIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Messages container - 75vh minus header */}
      <Box
        sx={{
          height: "calc(75vh - 64px)", // 75% of viewport height minus header
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <MessageContainer ref={messageContainerRef}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography color="text.secondary">
                No messages yet. Start a conversation!
              </Typography>
            </Box>
          ) : (
            <MessageScrollArea>
              {messages.map((message, index) => renderMessage(message, index))}
              <div ref={messagesEndRef} />
            </MessageScrollArea>
          )}
        </MessageContainer>
      </Box>

      {/* Error message - if present */}
      {error && (
        <Box
          sx={{
            p: 2,
            bgcolor: "error.dark",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Typography color="white">{error}</Typography>
        </Box>
      )}

      {/* Input area - 25vh height */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          height: "25vh", // 25% of viewport height
          minHeight: "160px", // Minimum height to ensure microphone is visible
          boxSizing: "border-box",
          position: "relative", // Not absolute/fixed - natural document flow
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
        }}
      >
        {/* Text input */}
        <Box
          sx={{ display: "flex", alignItems: "center", width: "100%", mb: 2 }}
        >
          <MessageInput
            fullWidth
            placeholder="Type a message..."
            multiline
            maxRows={3}
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
                    disabled={sending || input.trim() === ""}
                  >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            variant="outlined"
            sx={{ width: "100%" }}
          />
        </Box>

        {/* Microphone component */}
        {agent && (
          <Box sx={{ width: "100%", flexGrow: 0 }}>
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
