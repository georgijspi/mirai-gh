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

const bounceAnimation = {
  animation: "bounce 0.5s",
};

const keyframes = `
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: scale(1);}
  40% {transform: scale(1.3);}
  60% {transform: scale(1.15);}
}
`;

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

  const setupWebSocket = useCallback(() => {
    if (!conversationId) {
      console.warn("Cannot setup WebSocket without conversation ID");
      return;
    }

    try {
      wsEndpoint.current = `conversation/${conversationId}`;
      console.log(`Setting up WebSocket for endpoint: ${wsEndpoint.current}`);
      websocketService.disconnect(wsEndpoint.current);
      websocketService.connect(wsEndpoint.current, handleWebSocketMessage);
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      setError(
        "WebSocket connection failed. Messages will not update in real-time."
      );
    }
  }, [conversationId]);

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

        if (data.message.message_uid) {
          setTimeout(() => {
            playMessageAudioFromServer(data.message.message_uid);
          }, 500);
        }

        return updatedMessages;
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchConversationById(conversationId);
        setConversation(response);
        setTitleInput(response.title || "Conversation");
        setMessages(response.messages || []);

        const initialRatingStates = {};
        response.messages?.forEach((message) => {
          if (message.message_type === "agent" && message.message_uid) {
            initialRatingStates[message.message_uid] = message.rating || "none";
          }
        });
        setRatingStates(initialRatingStates);

        if (response.agent_uid) {
          try {
            const agentData = await fetchAgentByUid(response.agent_uid);
            if (!agentData) {
              console.error("No agent data returned");
              setError("Failed to load agent data - agent not found");
            } else {
              console.log("Agent data loaded:", agentData);
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

        setupWebSocket();

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

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTitle]);

  const sendMessage = async (content) => {
    const messageText = content || input;

    if (messageText.trim() === "") return;

    try {
      setSending(true);

      const userMessage = {
        content: messageText,
        message_type: "user",
        conversation_uid: conversationId,
        created_at: new Date().toISOString(),
        message_uid: `temp-${Date.now()}`,
      };
      
      setMessages((prev) => [...prev, userMessage]);

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

  useEffect(() => {
    const checkAudioState = () => {
      const { isPlaying, isPaused: audioPaused, currentAudioId } = getAudioPlaybackState();
    
      
      if (isPlaying || audioPaused) {
        if (currentAudioId && currentAudioId !== playingAudioId) {
          setPlayingAudioId(currentAudioId);
        }
      } else if (!isPlaying && !audioPaused) {
        if (!isPaused) {
          setPlayingAudioId(null);
        }
      }
      
      if (audioPaused !== isPaused) {
        setIsPaused(audioPaused);
      }
    };

    const intervalId = setInterval(checkAudioState, 500);
    
    return () => clearInterval(intervalId);
  }, [playingAudioId, isPaused]);

  const handleAudioControl = (message, action) => {
    if (!message || !message.message_uid) {
      return;
    }

    if (playingAudioId === message.message_uid) {
      if (action === "toggle") {
        if (isPaused) {
          resumeCurrentAudio();
          setIsPaused(false);
        } else {
          pauseCurrentAudio();
          setIsPaused(true);
        }
      } else if (action === "stop") {
        stopCurrentAudio();
        setPlayingAudioId(null);
        setIsPaused(false);
      }
    } else {
      if (message.message_uid) {
        if (playingAudioId) {
          stopCurrentAudio();
          setPlayingAudioId(null);
          setIsPaused(false);
        }

        playMessageAudioFromServer(message.message_uid);
      }
    }
  };

  const playMessageAudioFromServer = async (messageId) => {
    try {
      dispatchAudioEvent("audioPlaybackPending");
      
      dispatchAudioEvent("customAudioPlayback", {
        messageId: messageId
      });
      
      const response = await streamSpeech(messageId, conversationId);
      
      if (!response.ok) {
        console.error("Audio streaming response not OK:", response.status);
        dispatchAudioEvent("audioPlaybackFailed");
        return;
      }
      
      const audioBlob = await response.blob();
      
      if (!audioBlob || audioBlob.type.indexOf('audio/') !== 0) {
        console.error("Invalid audio blob type:", audioBlob?.type);
        dispatchAudioEvent("audioPlaybackFailed");
        return;
      }
      
          const audioUrl = URL.createObjectURL(audioBlob);
      
      playMessageAudio(audioUrl, messageId);
      setPlayingAudioId(messageId);
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to play message audio:", error);
      dispatchAudioEvent("audioPlaybackFailed");
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
    if (!dateString) return "";
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "";
      }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
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

    sendMessage(transcription);
  };

  const handleTitleClick = () => {
    setEditingTitle(true);
  };

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

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitleInput(conversation?.title || "Conversation");
      setEditingTitle(false);
    }
  };

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
      await rateMessage({
        message_uid: messageId,
        rating: newRating,
      });
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

  const renderMessage = (message, index) => {
    const isAgent = message.message_type === "agent";
    const hasAudio = isAgent;
    const isCurrentlyPlaying = message.message_uid === playingAudioId;
    
    const timestampField = message.created_at || message.timestamp || message.updated_at;

    return (
      <Box
              key={message.message_uid || index}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isAgent ? "flex-start" : "flex-end",
          mb: 2,
          maxWidth: "90%",
          alignSelf: isAgent ? "flex-start" : "flex-end",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-end", mb: 0.5 }}>
          {isAgent && agent && (
            <Avatar
              src={
                agent.profile_picture_url ||
                (agent.profile_picture_path
                  ? `${API_BASE_URL}${agent.profile_picture_path}`
                  : undefined)
              }
              alt={agent.name}
              sx={{
                width: 40,
                height: 40,
                mr: 1,
                bgcolor: "primary.dark",
                fontWeight: "bold",
                fontSize: "0.95rem",
              }}
            >
              {agent.name ? agent.name.charAt(0).toUpperCase() : "A"}
            </Avatar>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              maxWidth: "85%",
              backgroundColor: isAgent
                ? "rgba(90, 90, 90, 0.5)"
                : "rgba(25, 118, 210, 0.75)",
              borderTopLeftRadius: isAgent ? 0 : undefined,
              borderTopRightRadius: !isAgent ? 0 : undefined,
              position: "relative",
              wordBreak: "break-word",
            }}
          >
            <Typography variant="body1" component="div" color="text.primary">
              {message.content}
            </Typography>
            
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

          {!isAgent && <Box sx={{ width: 40, height: 40, ml: 1 }} />}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isAgent ? "flex-start" : "flex-end",
            pl: isAgent ? 5 : 0,
            pr: isAgent ? 0 : 5,
            mt: 0.5,
          }}
        >
          {isAgent && hasAudio && (
            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
              {isCurrentlyPlaying ? (
                <>
                  {isPaused ? (
                    <IconButton
                      size="small"
                      onClick={() => handleAudioControl(message, "toggle")}
                      color="primary"
                      sx={{ padding: '6px' }}
                    >
                      <PlayArrowIcon sx={{ fontSize: '1.3rem' }} />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => handleAudioControl(message, "toggle")}
                      color="primary"
                      sx={{ padding: '6px' }}
                    >
                      <PauseIcon sx={{ fontSize: '1.3rem' }} />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleAudioControl(message, "stop")}
                    color="primary"
                    sx={{ padding: '6px' }}
                  >
                    <StopIcon sx={{ fontSize: '1.3rem' }} />
                  </IconButton>
                </>
              ) : (
                <IconButton
                  size="small"
                  onClick={() => handleAudioControl(message, "toggle")}
                  color="primary"
                  sx={{ padding: '6px' }}
                >
                  <PlayArrowIcon sx={{ fontSize: '1.3rem' }} />
                </IconButton>
              )}
            </Box>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.7rem" }}
          >
            {formatTime(timestampField)}
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
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          height: "64px",
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

      <Box
        sx={{
          height: "calc(75vh - 64px)",
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

      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          height: "25vh",
          minHeight: "160px",
          boxSizing: "border-box",
          position: "relative",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
        }}
      >
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

      <style>{keyframes}</style>
    </Box>
  );
};

export default ConversationDetail;
