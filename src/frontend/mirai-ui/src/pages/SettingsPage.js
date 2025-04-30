import React, { useState, useEffect } from "react";
import WakeWordConfig from "../components/wakeword/WakeWordConfig";
import STTConfig from "../components/stt/STTConfig";
import LLMConfig from "../components/llm/LLMConfig";
import ModelManager from "../components/llm/ModelManager";
import Settings from "../components/Settings";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Container,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  SettingsVoice as VoiceIcon,
  VpnKey as KeyIcon,
  Memory as MemoryIcon,
  CloudDownload as DownloadIcon,
} from "@mui/icons-material";

const SettingsPage = ({ onConfigChange, config }) => {
  const [keywordModel, setKeywordModel] = useState(
    config.keywordModel || "Alexa"
  );
  const [accessKey, setAccessKey] = useState(config.accessKey || "");
  const [leopardModelPublicPath, setLeopardModelPublicPath] = useState(
    config.leopardModelPublicPath || "/models/leopard_params.pv"
  );
  const [porcupineModelPublicPath, setPorcupineModelPublicPath] = useState(
    config.porcupineModelPublicPath || "/models/porcupine_params.pv"
  );
  const [customKeywordModelPath, setCustomKeywordModelPath] = useState(
    config.customKeywordModelPath || ""
  );
  const [customKeywordLabel, setCustomKeywordLabel] = useState(
    config.customKeywordLabel || "Custom Keyword"
  );
  const [useCustomKeyword, setUseCustomKeyword] = useState(
    config.useCustomKeyword || false
  );
  const [activeTab, setActiveTab] = useState(0);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Update component state when config changes
  useEffect(() => {
    setKeywordModel(config.keywordModel || "Alexa");
    setAccessKey(config.accessKey || "");
    setLeopardModelPublicPath(
      config.leopardModelPublicPath || "/models/leopard_params.pv"
    );
    setPorcupineModelPublicPath(
      config.porcupineModelPublicPath || "/models/porcupine_params.pv"
    );
    setCustomKeywordModelPath(config.customKeywordModelPath || "");
    setCustomKeywordLabel(config.customKeywordLabel || "Custom Keyword");
    setUseCustomKeyword(config.useCustomKeyword || false);
  }, [config]);

  // Update global config when local state changes
  useEffect(() => {
    const storedAccessKey = localStorage.getItem('picovoice_access_key');
    if (storedAccessKey && storedAccessKey !== accessKey) {
      setAccessKey(storedAccessKey);
      
      // Also update the parent component's config
      const newConfig = {
        ...config,
        accessKey: storedAccessKey
      };
      onConfigChange(newConfig);
    }
  }, []);

  const handleConfigChange = () => {
    // Save to localStorage for persistence across app
    localStorage.setItem('picovoice_access_key', accessKey);
    
    const newConfig = {
      keywordModel,
      leopardModelPublicPath,
      porcupineModelPublicPath,
      accessKey,
      customKeywordModelPath,
      customKeywordLabel,
      useCustomKeyword,
    };
    console.log("Saving new config:", newConfig);
    onConfigChange(newConfig);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
        Settings
      </Typography>
      
      <Paper sx={{ mb: 4 }} elevation={3}>
        <Tabs 
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<VoiceIcon />} label="Voice Settings" />
          <Tab icon={<KeyIcon />} label="Access Keys" />
          <Tab icon={<MemoryIcon />} label="LLM Configuration" />
          <Tab icon={<DownloadIcon />} label="Model Management" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
              <WakeWordConfig
                keywordModel={keywordModel}
                setKeywordModel={setKeywordModel}
                useCustomKeyword={useCustomKeyword}
                setUseCustomKeyword={setUseCustomKeyword}
                customKeywordModelPath={customKeywordModelPath}
                setCustomKeywordModelPath={setCustomKeywordModelPath}
                customKeywordLabel={customKeywordLabel}
                setCustomKeywordLabel={setCustomKeywordLabel}
                porcupineModelPublicPath={porcupineModelPublicPath}
                setPorcupineModelPublicPath={setPorcupineModelPublicPath}
              />
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
              <STTConfig
                accessKey={accessKey}
                setAccessKey={setAccessKey}
              />
            </Paper>
            
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleConfigChange}
              sx={{ mt: 2 }}
            >
              Save Configuration
            </Button>
          </Box>
        )}

        {activeTab === 1 && <Settings />}

        {activeTab === 2 && <LLMConfig />}

        {activeTab === 3 && <ModelManager />}
      </Box>
    </Container>
  );
};

export default SettingsPage;
