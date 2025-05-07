import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  InputLabel,
  FormHelperText,
  Grid,
  Paper,
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

// List of built-in keywords for Porcupine
const BUILT_IN_KEYWORDS = [
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

const AgentForm = ({
  agentData,
  isEditing,
  llmConfigs,
  llmConfigsLoading,
  handleInputChange,
  onSubmit,
  onCancel,
}) => {
  const formTitle = isEditing ? "Edit Agent" : "Create New Agent";
  const submitButtonText = isEditing ? "Save Changes" : "Create Agent";

  const handleWakewordTypeChange = (e) => {
    handleInputChange({
      target: {
        name: "wakeword_type",
        value: e.target.value,
      },
    });
  };

  const handleWakewordFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".ppn")) {
        alert("Please upload a valid .ppn wakeword model file");
        e.target.value = "";
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size too large. Please upload a file smaller than 10MB");
        e.target.value = "";
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          "http://localhost:8005/mirai/api/wakeword/upload-model",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload wake word model");
        }

        const data = await response.json();

        if (data.status === "success" && data.file_path) {
          handleInputChange({
            target: {
              name: "wakeword_model_path",
              value: data.file_path,
            },
          });
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error) {
        console.error("Error uploading wake word model:", error);
        alert("Failed to upload wake word model. Please try again.");
        e.target.value = "";
      }
    }
  };

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight="bold"
        color="primary"
        gutterBottom
        mb={3}
      >
        {formTitle}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Name"
            name="name"
            value={agentData.name || ""}
            onChange={handleInputChange}
            fullWidth
            required
            variant="outlined"
            placeholder="Agent Name"
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="llm-config-label">LLM Configuration</InputLabel>
            <Select
              labelId="llm-config-label"
              id="llm_config_uid"
              name="llm_config_uid"
              value={agentData.llm_config_uid || ""}
              onChange={handleInputChange}
              label="LLM Configuration"
              disabled={llmConfigsLoading}
            >
              <MenuItem value="">
                <em>Select an LLM Configuration</em>
              </MenuItem>
              {llmConfigs && llmConfigs.length > 0
                ? llmConfigs.map((config) => (
                    <MenuItem key={config.config_uid} value={config.config_uid}>
                      {config.name}
                    </MenuItem>
                  ))
                : null}
            </Select>
            {llmConfigsLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="caption">
                  Loading configurations...
                </Typography>
              </Box>
            ) : llmConfigs.length === 0 ? (
              <FormHelperText error>
                No LLM configurations found. Please create one in the LLM
                Configuration section.
              </FormHelperText>
            ) : null}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 2,
              mb: 3,
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              fontWeight="medium"
              color="primary"
            >
              Personality Prompt
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Describe the agent's personality, behavior, knowledge, and how it
              should interact with users. This will guide the AI in generating
              appropriate responses.
            </Typography>
            <TextField
              name="personality_prompt"
              value={agentData.personality_prompt || ""}
              onChange={handleInputChange}
              fullWidth
              required
              multiline
              rows={8}
              variant="outlined"
              placeholder="You are a helpful assistant named [name]. You are knowledgeable about [topics]. Your tone is [friendly/professional/etc.]. You should always [specific behaviors]..."
              InputProps={{
                sx: {
                  fontFamily: "monospace",
                  fontSize: "0.95rem",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.light",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{ p: 3, borderRadius: 2, height: "100%" }}
          >
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Voice & Appearance
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    gutterBottom
                  >
                    Voice Speaker
                  </Typography>
                  <Box sx={{ height: "56px" }}>
                    <TextField
                      fullWidth
                      name="voice_speaker"
                      value={agentData.voice_speaker || ""}
                      onChange={handleInputChange}
                      variant="outlined"
                      placeholder="e.g., morgan"
                      size="medium"
                    />
                  </Box>
                  <FormHelperText>
                    Voice to use for text-to-speech
                  </FormHelperText>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    gutterBottom
                  >
                    Profile Picture
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ height: "56px", textTransform: "none" }}
                  >
                    {agentData.profile_picture
                      ? agentData.profile_picture.name
                      : "Choose Image File"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleInputChange({
                            target: {
                              name: "profile_picture",
                              value: file,
                            },
                          });
                        }
                      }}
                    />
                  </Button>
                  <FormHelperText>
                    Optional: Upload a profile picture
                  </FormHelperText>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    gutterBottom
                  >
                    Custom Voice File
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ height: "56px", textTransform: "none" }}
                  >
                    {agentData.custom_voice
                      ? agentData.custom_voice.name
                      : "Choose Audio File"}
                    <input
                      type="file"
                      hidden
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleInputChange({
                            target: {
                              name: "custom_voice",
                              value: file,
                            },
                          });
                        }
                      }}
                    />
                  </Button>
                  <FormHelperText>
                    Optional: Upload a custom voice file
                  </FormHelperText>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{ p: 3, borderRadius: 2, height: "100%" }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Wakeword Configuration
            </Typography>

            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend">Wakeword Type</FormLabel>
              <RadioGroup
                row
                name="wakeword_type"
                value={agentData.wakeword_type || "default"}
                onChange={handleWakewordTypeChange}
              >
                <FormControlLabel
                  value="default"
                  control={<Radio />}
                  label="Built-in Wakeword"
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="Custom Wakeword"
                />
              </RadioGroup>
            </FormControl>

            {agentData.wakeword_type === "default" ? (
              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel id="built-in-wakeword-label">
                  Built-in Wakeword
                </InputLabel>
                <Select
                  labelId="built-in-wakeword-label"
                  id="built_in_wakeword"
                  name="built_in_wakeword"
                  value={agentData.built_in_wakeword || ""}
                  onChange={handleInputChange}
                  label="Built-in Wakeword"
                >
                  <MenuItem value="">
                    <em>Select a wakeword</em>
                  </MenuItem>
                  {BUILT_IN_KEYWORDS.map((keyword) => (
                    <MenuItem key={keyword} value={keyword}>
                      {keyword}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Choose one of the pre-trained wakewords
                </FormHelperText>
              </FormControl>
            ) : (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="medium"
                  gutterBottom
                >
                  Custom Wakeword Model (.ppn file)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ height: "56px", textTransform: "none" }}
                >
                  {agentData.wakeword_model
                    ? agentData.wakeword_model.name
                    : "Upload .ppn File"}
                  <input
                    type="file"
                    hidden
                    accept=".ppn"
                    onChange={handleWakewordFileChange}
                  />
                </Button>
                <FormHelperText>
                  Upload a custom Porcupine wakeword model (.ppn file)
                </FormHelperText>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          size="large"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={onSubmit}
          size="large"
        >
          {submitButtonText}
        </Button>
      </Box>
    </Box>
  );
};

export default AgentForm;
