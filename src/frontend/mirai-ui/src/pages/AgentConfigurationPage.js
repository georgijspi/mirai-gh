import React from "react";
import AgentConfiguration from "../components/agent/AgentConfiguration";
import { Box } from "@mui/material";

const AgentConfigurationPage = () => {
  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: 'calc(100vh - 64px)', 
      bgcolor: 'background.default',
      overflowX: 'hidden'
    }}>
      <AgentConfiguration />
    </Box>
  );
};

export default AgentConfigurationPage;
