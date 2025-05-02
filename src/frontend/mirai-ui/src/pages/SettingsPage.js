import React, { useState, useEffect } from "react";
import Settings from "../components/Settings";
import LLMConfig from "../components/llm/LLMConfig";
import ModelManager from "../components/llm/ModelManager";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  VpnKey as KeyIcon,
  Memory as MemoryIcon,
  CloudDownload as DownloadIcon,
} from "@mui/icons-material";

const SettingsPage = ({ onConfigChange, config }) => {
  const [activeTab, setActiveTab] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        color="primary"
        fontWeight="bold"
      >
        Settings
      </Typography>

      <Paper sx={{ mb: 4 }} elevation={3}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab icon={<KeyIcon />} label="Access Keys" />
          <Tab icon={<MemoryIcon />} label="LLM Configuration" />
          <Tab icon={<DownloadIcon />} label="Model Management" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && (
          <Box data-testid="access-keys-content">
            <Settings />
          </Box>
        )}

        {activeTab === 1 && (
          <Box data-testid="llm-config-content">
            <LLMConfig />
          </Box>
        )}

        {activeTab === 2 && (
          <Box data-testid="model-management-content">
            <ModelManager />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SettingsPage;
