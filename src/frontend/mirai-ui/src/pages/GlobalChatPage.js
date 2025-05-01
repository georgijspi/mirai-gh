import React from "react";
import GlobalChat from "../components/GlobalChat";

const GlobalChatPage = ({ config }) => {
  return (
    <GlobalChat
      data-testid="global-chat"
      data-config={JSON.stringify(config)}
      config={config}
    />
  );
};

export default GlobalChatPage;
