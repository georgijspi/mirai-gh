import React from "react";
import AgentConfiguration from "../components/agent/AgentConfiguration";
import { Box } from "@mui/material";

const AgentConfigurationPage = () => {
  return (
    <Box
      data-testid="agent-config-page"
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        bgcolor: "background.default",
        overflowX: "hidden",
      }}
    >
      <AgentConfiguration data-testid="agent-configuration" />
    </Box>
  );
};

export default AgentConfigurationPage;
