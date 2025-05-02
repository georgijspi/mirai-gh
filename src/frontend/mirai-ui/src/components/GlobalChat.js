import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  CircularProgress,
  InputAdornment,
  AppBar,
  Toolbar,
  Card,
  MenuItem,
  Menu,
  Button,
  styled,
  Tooltip,
} from "@mui/material";
import {
  Send as SendIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Person as PersonIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import {
  playMessageAudio,
  stopCurrentAudio,
  pauseCurrentAudio,
  resumeCurrentAudio,
  getAudioPlaybackState,
} from "../utils/audioUtils";
import websocketService from "../services/websocketService";
import {
  fetchGlobalConversation,
  sendGlobalMessage,
  rateGlobalMessage,
} from "../services/globalConversationService";
import { fetchAgents } from "../services/agentService";
import { streamSpeech } from "../services/ttsService";
import { API_BASE_URL } from "../config/apiConfig";

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

const GlobalChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [ratingStates, setRatingStates] = useState({});
  const [ratingLoading, setRatingLoading] = useState({});
  const [animatingRatings, setAnimatingRatings] = useState({});
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  
  // Agent selection
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentMenuAnchor, setAgentMenuAnchor] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Load agents first
        setLoadingAgents(true);
        const agentsResponse = await fetchAgents();
        setAgents(agentsResponse.agents || []);
        
        // Set first agent as default if available
        if (agentsResponse.agents && agentsResponse.agents.length > 0) {
          setSelectedAgent(agentsResponse.agents[0]);
        }
        setLoadingAgents(false);
        
        // Load global conversation
        const response = await fetchGlobalConversation();
        setMessages(response.messages || []);
        
        // Initialize rating states
        const initialRatingStates = {};
        response.messages?.forEach((message) => {
          if (message.message_type === "agent" && message.message_uid) {
            initialRatingStates[message.message_uid] = message.rating || "none";
          }
        });
        setRatingStates(initialRatingStates);
        
        // Setup WebSocket
        websocketService.connect("global", handleWebSocketMessage);
      } catch (err) {
        console.error("Error loading global chat:", err);
        setError(`Failed to load: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      websocketService.disconnect("global");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const sendMessage = async () => {
    if (input.trim() === "" || !selectedAgent) return;

    try {
      setSending(true);

      // Add user message to UI immediately
      const userMessage = {
        content: input,
        message_type: "user",
        created_at: new Date().toISOString(),
        message_uid: `temp-${Date.now()}`,
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Send message to server with selected agent
      await sendGlobalMessage(input, selectedAgent.agent_uid);

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
      const response = await streamSpeech(messageId, "global");
      
      if (!response.ok) {
        console.error("Audio streaming response not OK:", response.status);
        return;
      }
      
      const audioBlob = await response.blob();
      
      if (!audioBlob || audioBlob.type.indexOf('audio/') !== 0) {
        console.error("Invalid audio blob type:", audioBlob?.type);
        return;
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      playMessageAudio(audioUrl, messageId);
      setPlayingAudioId(messageId);
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to play message audio:", error);
    }
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

  // Agent menu handlers
  const handleAgentMenuOpen = (event) => {
    setAgentMenuAnchor(event.currentTarget);
  };

  const handleAgentMenuClose = () => {
    setAgentMenuAnchor(null);
  };

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
    handleAgentMenuClose();
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
      await rateGlobalMessage(messageId, newRating);
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

    // Find the agent that sent this message
    const messageAgent = isAgent && agents.find(a => 
      a.agent_uid === message.agent_uid || 
      (message.metadata && a.agent_uid === message.metadata.agent_uid)
    );

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
          {isAgent && (
            <Avatar
              src={
                messageAgent?.profile_picture_url ||
                (messageAgent?.profile_picture_path
                  ? `${API_BASE_URL}${messageAgent.profile_picture_path}`
                  : undefined)
              }
              alt={messageAgent?.name || "AI"}
              sx={{
                width: 40,
                height: 40,
                mr: 1,
                bgcolor: "primary.dark",
                fontWeight: "bold",
                fontSize: "0.95rem",
              }}
            >
              {messageAgent?.name ? messageAgent.name.charAt(0).toUpperCase() : "A"}
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
        height: "95vh",
        maxHeight: "95vh",
        width: "100%",
        position: "relative",
        bgcolor: "background.default",
        overflow: "hidden",
        maxWidth: "1200px",
        margin: "0 auto",
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Global Chat
          </Typography>
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
          height: "auto",
          minHeight: "100px",
          boxSizing: "border-box",
          position: "relative",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <Box
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            width: "100%", 
            mb: 2,
            gap: 1 
          }}
        >
          <Box 
            sx={{ 
              minWidth: 140,
              cursor: 'pointer',
            }}
          >
            {loadingAgents ? (
              <CircularProgress size={24} />
            ) : (
              <Tooltip title="Select an agent to chat with">
                <Card
                  onClick={handleAgentMenuOpen}
                  elevation={1}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    height: '56px',
                    bgcolor: selectedAgent ? 'background.paper' : 'action.selected'
                  }}
                >
                  <Avatar
                    src={
                      selectedAgent?.profile_picture_url ||
                      (selectedAgent?.profile_picture_path
                        ? `${API_BASE_URL}${selectedAgent.profile_picture_path}`
                        : undefined)
                    }
                    sx={{ width: 38, height: 38, mr: 1 }}
                  >
                    {selectedAgent?.name ? selectedAgent.name.charAt(0).toUpperCase() : <PersonIcon />}
                  </Avatar>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ 
                      maxWidth: 65,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 'medium'
                    }}
                  >
                    {selectedAgent?.name || "Select Agent"}
                  </Typography>
                  <ArrowDropDownIcon color="action" />
                </Card>
              </Tooltip>
            )}
            <Menu
              anchorEl={agentMenuAnchor}
              open={Boolean(agentMenuAnchor)}
              onClose={handleAgentMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              {agents.map((agent) => (
                <MenuItem 
                  key={agent.agent_uid}
                  onClick={() => handleAgentSelect(agent)}
                  selected={selectedAgent?.agent_uid === agent.agent_uid}
                >
                  <Avatar
                    src={
                      agent.profile_picture_url ||
                      (agent.profile_picture_path
                        ? `${API_BASE_URL}${agent.profile_picture_path}`
                        : undefined)
                    }
                    sx={{ width: 24, height: 24, mr: 1 }}
                  >
                    {agent.name ? agent.name.charAt(0).toUpperCase() : <PersonIcon />}
                  </Avatar>
                  <Typography variant="body2">{agent.name}</Typography>
                </MenuItem>
              ))}
              {agents.length === 0 && (
                <MenuItem disabled>
                  <Typography variant="body2">No agents available</Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>
          
          <MessageInput
            fullWidth
            placeholder={selectedAgent ? `Chat with ${selectedAgent.name}...` : "Select an agent to chat..."}
            multiline
            maxRows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || !selectedAgent}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    onClick={sendMessage}
                    disabled={sending || input.trim() === "" || !selectedAgent}
                  >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
        </Box>
      </Box>

      <style>{keyframes}</style>
    </Box>
  );
};

export default GlobalChat;
