import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  useMediaQuery,
  Alert,
  Snackbar
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { API_BASE_URL } from "../../config/apiConfig";
import { fetchAgents } from "../../services/agentService";
import {
  fetchConversations,
  createConversation as createConversationService,
} from "../../services/conversationService";
import ConversationDetail from "./ConversationDetail";

// Styled components
const ConversationListItem = styled(Card)(({ theme, isSelected }) => ({
  marginBottom: theme.spacing(1),
  backgroundColor: isSelected ? 'rgba(144, 202, 249, 0.16)' : theme.palette.background.paper,
  transition: theme.transitions.create(['background-color'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    backgroundColor: isSelected ? 'rgba(144, 202, 249, 0.24)' : 'rgba(255, 255, 255, 0.05)',
  },
  borderRadius: theme.shape.borderRadius,
}));

const AgentCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  transition: theme.transitions.create(['background-color'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  borderRadius: theme.shape.borderRadius,
}));

const Conversations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // Mobile specific states
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  // When on mobile and a conversation is selected, open the detail view
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setMobileDetailOpen(true);
    }
  }, [selectedConversation, isMobile]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetchConversations();
      setConversations(response.conversations || []);
    } catch (err) {
      setError(`Failed to load conversations: ${err.message}`);
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      setLoadingAgents(true);
      const response = await fetchAgents(false); // Doesn't include archived agents
      setAgents(response.agents || []);
      setShowNewConversationModal(true);
    } catch (err) {
      setError(`Failed to load agents: ${err.message}`);
      console.error("Error loading agents:", err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const createConversation = async (agentUid) => {
    try {
      setLoading(true);
      const response = await createConversationService(agentUid);

      setShowNewConversationModal(false);
      await loadConversations();

      setSelectedConversation(response.conversation_uid);
    } catch (err) {
      setError(`Failed to create conversation: ${err.message}`);
      console.error("Error creating conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromDetail = () => {
    if (isMobile) {
      setMobileDetailOpen(false);
    }
    setSelectedConversation(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Conversation list component
  const ConversationsList = () => (
    <Box 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Conversations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleNewConversation}
          size="small"
        >
          New
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
            height: '100%'
          }}>
            <Typography color="text.secondary" align="center">
              No conversations yet. Start a new one!
            </Typography>
          </Box>
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.conversation_uid}
              isSelected={selectedConversation === conversation.conversation_uid}
              elevation={1}
            >
              <CardActionArea
                onClick={() => setSelectedConversation(conversation.conversation_uid)}
                sx={{ p: 1 }}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body1" fontWeight="medium" color="text.primary" noWrap>
                    {conversation.title || "Untitled Conversation"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(conversation.updated_at || conversation.created_at)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </ConversationListItem>
          ))
        )}
      </Box>
    </Box>
  );

  // Render based on screen size
  if (isMobile) {
    return (
      <Box sx={{ height: '100%' }}>
        {/* List view (main view on mobile) */}
        <Box sx={{ height: '100%', display: mobileDetailOpen ? 'none' : 'block' }}>
          <ConversationsList />
        </Box>

        {/* Detail view as drawer on mobile */}
        <Drawer
          anchor="right"
          open={mobileDetailOpen}
          onClose={() => setMobileDetailOpen(false)}
          sx={{ 
            '& .MuiDrawer-paper': { 
              width: '100%',
              height: '100%',
              boxSizing: 'border-box'
            },
          }}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
        >
          {selectedConversation && (
            <ConversationDetail
              conversationId={selectedConversation}
              onBack={handleBackFromDetail}
              isMobile={true}
            />
          )}
        </Drawer>

        {/* New Conversation Dialog */}
        <Dialog
          open={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1
          }}>
            <Typography variant="h6">Select an Agent</Typography>
            <IconButton
              onClick={() => setShowNewConversationModal(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            {loadingAgents ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {agents.map((agent) => (
                  <Grid key={agent.agent_uid} xs={12} sm={6} item>
                    <AgentCard elevation={1}>
                      <CardActionArea onClick={() => createConversation(agent.agent_uid)}>
                        <CardContent sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          '&:last-child': { pb: 2 }
                        }}>
                          <Avatar
                            sx={{ width: 50, height: 50, mr: 2 }}
                            src={agent.profile_picture_url || (agent.profile_picture_path ? `${API_BASE_URL}${agent.profile_picture_path}` : undefined)}
                          >
                            {agent.name?.charAt(0).toUpperCase() || 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {agent.name || "Unnamed Agent"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {agent.llm_config_name || "Default LLM"}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </AgentCard>
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  // Desktop layout
  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100%', 
      backgroundColor: theme.palette.background.default 
    }}>
      {/* Conversations List Panel */}
      <Paper 
        sx={{ 
          width: 320, 
          minWidth: 320,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          borderRight: `1px solid ${theme.palette.divider}`
        }}
        elevation={0}
      >
        <ConversationsList />
      </Paper>

      {/* Conversation Detail Panel */}
      <Box sx={{ 
        flexGrow: 1, 
        height: '100%', 
        overflow: 'hidden',
        display: 'flex'
      }}>
        {selectedConversation ? (
          <ConversationDetail
            conversationId={selectedConversation}
            onBack={handleBackFromDetail}
          />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            width: '100%',
            p: 3
          }}>
            <Typography color="text.secondary" variant="h6" align="center">
              Select a conversation or start a new one
            </Typography>
          </Box>
        )}
      </Box>

      {/* New Conversation Dialog */}
      <Dialog
        open={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6">Select an Agent</Typography>
          <IconButton
            onClick={() => setShowNewConversationModal(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {loadingAgents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {agents.map((agent) => (
                <Grid key={agent.agent_uid} item xs={6} md={4}>
                  <AgentCard elevation={1}>
                    <CardActionArea onClick={() => createConversation(agent.agent_uid)}>
                      <CardContent sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        '&:last-child': { pb: 2 }
                      }}>
                        <Avatar
                          sx={{ width: 50, height: 50, mr: 2 }}
                          src={agent.profile_picture_url || (agent.profile_picture_path ? `${API_BASE_URL}${agent.profile_picture_path}` : undefined)}
                        >
                          {agent.name?.charAt(0).toUpperCase() || 'A'}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {agent.name || "Unnamed Agent"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {agent.llm_config_name || "Default LLM"}
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </AgentCard>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Conversations;
