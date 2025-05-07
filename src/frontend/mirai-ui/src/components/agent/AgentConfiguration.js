import React, { useState, useEffect } from "react";
import {
  fetchAgents,
  createAgent,
  archiveAgent,
  updateAgent,
  fetchAgentByUid,
  uploadProfilePicture,
  uploadCustomVoice,
} from "../../services/agentService";
import { fetchLLMConfigs } from "../../services/llmService";
import AgentForm from "./AgentForm";

// Material-UI imports
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ComputerIcon from "@mui/icons-material/Computer";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { BuiltInKeyword } from "@picovoice/porcupine-web";

// Add API_BASE_URL import
const API_BASE_URL = "http://localhost:8005/mirai/api";

const AgentConfiguration = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isMedium = useMediaQuery(theme.breakpoints.down("lg"));

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [llmConfigsLoading, setLlmConfigsLoading] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [newAgent, setNewAgent] = useState({
    name: "",
    personality_prompt: "",
    voice_speaker: "",
    llm_config_uid: "",
    profile_picture: null,
    custom_voice: null,
    wakeword_type: "default",
    built_in_wakeword: "Computer",
    is_archived: false,
  });

  useEffect(() => {
    loadAgents();
    loadLlmConfigs();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await fetchAgents(false);
      setAgents(data.agents || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError("Failed to load agents. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const loadLlmConfigs = async () => {
    if (llmConfigsLoading) return;
    try {
      setLlmConfigsLoading(true);
      const configs = await fetchLLMConfigs(false);
      setLlmConfigs(configs || []);
    } catch (err) {
      console.error("Error fetching LLM configurations:", err);
      setError("Failed to load LLM configurations. Please try again later.");
    } finally {
      setLlmConfigsLoading(false);
    }
  };

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Determine which state to update based on whether we're editing or creating
    if (editingAgent) {
      // We're editing an existing agent
      setEditingAgent((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    } else {
      // We're creating a new agent
      setNewAgent((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Toggle form visibility
  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    if (editingAgent) {
      setEditingAgent(null);
    }
  };

  // Add a new agent
  const addAgent = async () => {
    try {
      if (
        !newAgent.name ||
        !newAgent.personality_prompt ||
        !newAgent.llm_config_uid
      ) {
        setError(
          "Name, personality prompt, and LLM configuration are required."
        );
        return;
      }

      // Create the agent first
      const agentData = { ...newAgent };
      delete agentData.profile_picture;
      delete agentData.custom_voice;
      const data = await createAgent(agentData);

      // If there's a profile picture, upload it
      if (newAgent.profile_picture) {
        try {
          await uploadProfilePicture(data.agent_uid, newAgent.profile_picture);
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
        }
      }

      // If there's a custom voice file, upload it
      if (newAgent.custom_voice) {
        try {
          await uploadCustomVoice(data.agent_uid, newAgent.custom_voice);
        } catch (uploadError) {
          console.error("Error uploading custom voice file:", uploadError);
        }
      }

      await loadAgents();

      setNewAgent({
        name: "",
        personality_prompt: "",
        voice_speaker: "",
        llm_config_uid: "",
        profile_picture: null,
        custom_voice: null,
        is_archived: false,
      });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("Error adding agent:", err);
      setError("Failed to add agent. Please try again.");
    }
  };

  // Start editing an agent
  const startEditingAgent = async (agentUid) => {
    try {
      const agent = await fetchAgentByUid(agentUid);
      loadLlmConfigs();
      setEditingAgent(agent);
      setShowAddForm(false);
    } catch (err) {
      console.error("Error fetching agent details:", err);
      setError("Failed to load agent details. Please try again.");
    }
  };

  // Save edited agent
  const saveEditedAgent = async () => {
    try {
      if (
        !editingAgent.name ||
        !editingAgent.personality_prompt ||
        !editingAgent.llm_config_uid
      ) {
        setError(
          "Name, personality prompt, and LLM configuration are required."
        );
        return;
      }

      const agentUid = editingAgent.agent_uid;
      const agentData = { ...editingAgent };
      console.log(agentData);
      delete agentData.agent_uid;
      delete agentData.profile_picture;
      delete agentData.custom_voice;
      delete agentData.created_at;
      delete agentData.updated_at;

      await updateAgent(agentUid, agentData);

      // Handle file uploads
      if (editingAgent.profile_picture) {
        try {
          await uploadProfilePicture(agentUid, editingAgent.profile_picture);
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
        }
      }

      if (editingAgent.custom_voice) {
        try {
          await uploadCustomVoice(agentUid, editingAgent.custom_voice);
        } catch (uploadError) {
          console.error("Error uploading custom voice file:", uploadError);
        }
      }

      await loadAgents();
      setEditingAgent(null);
      setError(null);
    } catch (err) {
      console.error("Error updating agent:", err);
      setError("Failed to update agent. Please try again.");
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    loadLlmConfigs();
    setEditingAgent(null);
  };

  // Confirm delete dialog
  const confirmDelete = (agentUid) => {
    setAgentToDelete(agentUid);
    setDeleteConfirmOpen(true);
  };

  // Delete an agent
  const deleteAgent = async () => {
    try {
      if (!agentToDelete) return;

      await archiveAgent(agentToDelete);
      await loadAgents();
      setDeleteConfirmOpen(false);
      setAgentToDelete(null);
    } catch (err) {
      console.error("Error deleting agent:", err);
      setError("Failed to delete agent. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Loading agents...
        </Typography>
      </Box>
    );
  }

  // Get the name of the LLM config from the list
  const getLlmConfigName = (configId) => {
    const config = llmConfigs.find((c) => c.config_uid === configId);
    return config ? config.name : configId.substring(0, 8) + "...";
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: "1600px",
        mx: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          borderBottom: 1,
          borderColor: "divider",
          pb: 2,
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Agent Configuration
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={showAddForm ? <CloseIcon /> : <AddIcon />}
          onClick={toggleAddForm}
          size="large"
        >
          {showAddForm ? "Cancel" : "Add New Agent"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {showAddForm && (
        <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <AgentForm
            agentData={newAgent}
            isEditing={false}
            llmConfigs={llmConfigs}
            llmConfigsLoading={llmConfigsLoading}
            handleInputChange={handleInputChange}
            onSubmit={addAgent}
            onCancel={toggleAddForm}
          />
        </Paper>
      )}

      {editingAgent && (
        <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <AgentForm
            agentData={editingAgent}
            isEditing={true}
            llmConfigs={llmConfigs}
            llmConfigsLoading={llmConfigsLoading}
            handleInputChange={handleInputChange}
            onSubmit={saveEditedAgent}
            onCancel={cancelEditing}
          />
        </Paper>
      )}

      <Grid container spacing={3} justifyContent="center">
        {agents.map((agent) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={6}
            lg={4}
            xl={3}
            key={agent.agent_uid}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Card
              sx={{
                height: "100%",
                maxWidth: "340px",
                minWidth: "280px",
                width: "100%",
                mx: "auto",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: (theme) => theme.shadows[8],
                },
                boxShadow: 3,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "200px",
                  bgcolor: "primary.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                {agent.profile_picture_url ? (
                  <Box
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: "50%",
                      overflow: "hidden",
                      bgcolor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: 4,
                      borderColor: "white",
                    }}
                  >
                    <img
                      src={agent.profile_picture_url}
                      alt={`${agent.name}'s profile`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' fill='%231976d2'/%3E%3Ctext x='50%' y='50%' font-family='Arial' font-size='80' fill='white' dominant-baseline='middle' text-anchor='middle'%3E${agent.name
                          .charAt(0)
                          .toUpperCase()}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                  </Box>
                ) : agent.profile_picture_path ? (
                  <Box
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: "50%",
                      overflow: "hidden",
                      bgcolor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: 4,
                      borderColor: "white",
                    }}
                  >
                    <img
                      src={`${API_BASE_URL}/agent/${agent.agent_uid}/profile-picture`}
                      alt={`${agent.name}'s profile`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' fill='%231976d2'/%3E%3Ctext x='50%' y='50%' font-family='Arial' font-size='80' fill='white' dominant-baseline='middle' text-anchor='middle'%3E${agent.name
                          .charAt(0)
                          .toUpperCase()}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "4rem",
                      fontWeight: "bold",
                      color: "white",
                      border: 4,
                      borderColor: "white",
                    }}
                  >
                    {agent.name.charAt(0).toUpperCase()}
                  </Box>
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1, pt: 2, pb: 0, px: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  align="center"
                  gutterBottom
                  color="text.primary"
                  sx={{ mb: 1 }}
                >
                  {agent.name}
                </Typography>

                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{
                    mb: 2,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minHeight: "4em",
                    fontSize: "1rem",
                    fontWeight: "medium",
                  }}
                >
                  {agent.personality_prompt}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MicIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      noWrap
                      title={agent.voice_speaker}
                    >
                      {agent.voice_speaker || "Default"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <ComputerIcon
                      color="primary"
                      fontSize="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      noWrap
                      title={getLlmConfigName(agent.llm_config_uid)}
                    >
                      {getLlmConfigName(agent.llm_config_uid)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: "center", p: 2, pt: 0 }}>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => startEditingAgent(agent.agent_uid)}
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={() => confirmDelete(agent.agent_uid)}
                  color="error"
                  variant="contained"
                  size="small"
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {agents.length === 0 && (
          <Grid item xs={12}>
            <Paper
              sx={{ p: 4, textAlign: "center", boxShadow: 3, borderRadius: 2 }}
            >
              <Typography
                variant="h5"
                color="text.primary"
                fontWeight="bold"
                gutterBottom
              >
                No Agents Available
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                mb={3}
                fontSize="1.1rem"
              >
                Create your first agent to start building conversational
                experiences.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={toggleAddForm}
              >
                Add New Agent
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{ fontWeight: "bold", bgcolor: "error.main", color: "white" }}
        >
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1, px: 3, mt: 1 }}>
          <Typography variant="body1">
            Are you sure you want to delete this agent? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button onClick={deleteAgent} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentConfiguration;
