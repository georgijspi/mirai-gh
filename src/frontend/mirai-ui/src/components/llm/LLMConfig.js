import React, { useState, useEffect } from "react";
import {
  fetchLLMConfigs,
  deleteLLMConfig,
  updateLLMConfig,
  createLLMConfig,
  fetchAvailableModels,
  fetchLLMConfigByUid,
} from "../../services/llmService";
import {
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Slider,
  IconButton,
  Switch,
  Tooltip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  RestartAlt as RestartAltIcon,
} from "@mui/icons-material";

const defaultConfig = {
  name: "",
  model: "",
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  repeat_penalty: 1.1,
  max_tokens: 4096,
  presence_penalty: 0,
  frequency_penalty: 0,
  stop_sequences: [],
  additional_params: {},
  tts_instructions:
    'When responding, please follow these guidelines for better voice readability:\n1. Do not include parenthetical expressions like (smiles), (laughs), (pauses) in your text.\n2. Express emotions through your words rather than through stage directions.\n3. Use natural language patterns that flow well when read aloud.\n4. Avoid special formatting that might be difficult to interpret in speech.\n5. If you want to express actions or emotions, incorporate them into the text naturally.\nFor example, instead of "(laughs) That\'s funny", say "Haha, that\'s funny" or "That makes me laugh."',
  is_archived: false,
};

const LLMConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newConfig, setNewConfig] = useState(defaultConfig);
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    loadConfigs();
    loadAvailableModels();
  }, [includeArchived]);

  const loadAvailableModels = async () => {
    try {
      setModelsLoading(true);
      const models = await fetchAvailableModels();
      
      // Ensure models is an array
      if (models && Array.isArray(models.models)) {
        setAvailableModels(models.models);
      } else if (models && Array.isArray(models)) {
        setAvailableModels(models);
      } else {
        setAvailableModels([]);
      }
    } catch (err) {
      console.error("Failed to load available models:", err);
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLLMConfigs(includeArchived);
      setConfigs(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedConfig) {
        setSelectedConfig(data[0]);
      }
    } catch (err) {
      setError("Failed to load LLM configurations: " + (err.message || "Unknown error"));
      console.error(err);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedConfig) return;

    if (!window.confirm(`Are you sure you want to delete the configuration "${selectedConfig.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteLLMConfig(selectedConfig.config_uid);
      setMessage("Configuration deleted successfully");
      await loadConfigs();
      setSelectedConfig(null);
    } catch (err) {
      setError("Failed to delete configuration: " + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!selectedConfig) return;
    setEditedConfig({ ...selectedConfig });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedConfig) return;

    try {
      setLoading(true);
      await updateLLMConfig(editedConfig.config_uid, editedConfig);
      setMessage("Configuration updated successfully");

      // Fetch the updated config directly by its UID
      const updatedConfig = await fetchLLMConfigByUid(editedConfig.config_uid);
      setSelectedConfig(updatedConfig);

      // Also update the configs list to keep it in sync
      const updatedConfigs = await fetchLLMConfigs(includeArchived);
      setConfigs(Array.isArray(updatedConfigs) ? updatedConfigs : []);

      setIsEditing(false);
      setEditedConfig(null);
    } catch (err) {
      setError("Failed to update configuration: " + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedConfig(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setNewConfig(defaultConfig);
  };

  const handleSaveNew = async () => {
    try {
      setLoading(true);
      const response = await createLLMConfig(newConfig);
      setMessage("Configuration created successfully");

      // Fetch the newly created config directly by its UID
      const createdConfig = await fetchLLMConfigByUid(response.config_uid);
      setSelectedConfig(createdConfig);

      // Also update the configs list to keep it in sync
      const updatedConfigs = await fetchLLMConfigs(includeArchived);
      setConfigs(Array.isArray(updatedConfigs) ? updatedConfigs : []);

      setIsCreating(false);
      setNewConfig(defaultConfig);
    } catch (err) {
      setError("Failed to create configuration: " + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewConfig(defaultConfig);
  };

  const handleInputChange = (field, value) => {
    if (isCreating) {
      setNewConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else if (editedConfig) {
      setEditedConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const renderConfigForm = (config, isNew = false) => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            value={config.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Model</InputLabel>
            <Select
              value={config.model}
              label="Model"
              onChange={(e) => handleInputChange("model", e.target.value)}
              disabled={modelsLoading}
            >
              <MenuItem value="">
                <em>Select a model</em>
              </MenuItem>
              {availableModels.map((model) => (
                <MenuItem key={model.name} value={model.name}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography gutterBottom>
            Temperature: {config.temperature}
          </Typography>
          <Slider
            value={config.temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={(e, newValue) => handleInputChange("temperature", newValue)}
            valueLabelDisplay="auto"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Max Tokens"
            variant="outlined"
            type="number"
            value={config.max_tokens}
            onChange={(e) => handleInputChange("max_tokens", parseInt(e.target.value))}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Top P"
            variant="outlined"
            type="number"
            inputProps={{ step: 0.1, min: 0, max: 1 }}
            value={config.top_p}
            onChange={(e) => handleInputChange("top_p", parseFloat(e.target.value))}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Top K"
            variant="outlined"
            type="number"
            value={config.top_k}
            onChange={(e) => handleInputChange("top_k", parseInt(e.target.value))}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Repeat Penalty"
            variant="outlined"
            type="number"
            inputProps={{ step: 0.1 }}
            value={config.repeat_penalty}
            onChange={(e) => handleInputChange("repeat_penalty", parseFloat(e.target.value))}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Presence Penalty"
            variant="outlined"
            type="number"
            inputProps={{ step: 0.1 }}
            value={config.presence_penalty}
            onChange={(e) => handleInputChange("presence_penalty", parseFloat(e.target.value))}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Frequency Penalty"
            variant="outlined"
            type="number"
            inputProps={{ step: 0.1 }}
            value={config.frequency_penalty}
            onChange={(e) => handleInputChange("frequency_penalty", parseFloat(e.target.value))}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Text-to-Speech Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Define instructions for how the AI should format responses for better text-to-speech rendering. We recommend using our default guidelines for optimal results.
              </Typography>
            </Box>
            <Box sx={{ position: 'relative', mb: 1 }}>
              <TextField
                fullWidth
                label="TTS Instructions"
                variant="outlined"
                multiline
                rows={8}
                value={config.tts_instructions}
                onChange={(e) => handleInputChange("tts_instructions", e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& textarea': {
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                    },
                  },
                }}
                helperText="Instructions for the TTS system on how to read responses aloud. Describe any specific formatting or reading preferences."
              />
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                startIcon={<RestartAltIcon />}
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  zIndex: 1,
                  borderRadius: '4px 4px 0 0',
                  boxShadow: 1
                }}
                onClick={() => handleInputChange("tts_instructions", defaultConfig.tts_instructions)}
              >
                Reset to Recommended
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper', mb: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom color="primary">
          LLM Configuration
        </Typography>

        {message && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }} 
            onClose={() => setMessage(null)}
          >
            {message}
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
            }
            label="Include Archived Configurations"
          />
          
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadConfigs}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {!isCreating && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="config-select-label">Select Configuration</InputLabel>
                <Select
                  labelId="config-select-label"
                  value={selectedConfig?.config_uid || ""}
                  label="Select Configuration"
                  onChange={(e) => {
                    const config = configs.find(
                      (c) => c.config_uid === e.target.value
                    );
                    setSelectedConfig(config);
                    setIsEditing(false);
                    setEditedConfig(null);
                  }}
                  disabled={configs.length === 0}
                >
                  {configs.map((config) => (
                    <MenuItem key={config.config_uid} value={config.config_uid}>
                      {config.name} {config.is_archived ? "(Archived)" : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {isCreating ? (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Create New Configuration
                </Typography>
                {renderConfigForm(newConfig, true)}
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveNew}
                    disabled={loading}
                  >
                    Create
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelCreate}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            ) : selectedConfig ? (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {isEditing ? "Edit Configuration" : selectedConfig.name}
                </Typography>
                {isEditing ? (
                  <>
                    {renderConfigForm(editedConfig)}
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={loading}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    {renderConfigForm(selectedConfig)}
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                      >
                        Delete
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                No configurations available. Please create a new one.
              </Alert>
            )}

            {!isCreating && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{ mt: 2 }}
              >
                Create New Configuration
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LLMConfig;
