import React from "react";
import { Box } from "@mui/material";
import Conversations from "../components/conversation/Conversations";

const ConversationsPage = () => {
  return (
    <Box
      data-testid="conversations-page"
      sx={{ height: "100%", overflow: "hidden" }}
    >
      <Conversations data-testid="conversations" />
    </Box>
  );
};

export default ConversationsPage;
