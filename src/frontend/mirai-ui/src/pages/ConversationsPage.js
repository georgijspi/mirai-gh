import React from "react";
import { Box } from '@mui/material';
import Conversations from "../components/conversation/Conversations";

const ConversationsPage = () => {
  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      <Conversations />
    </Box>
  );
};

export default ConversationsPage;
