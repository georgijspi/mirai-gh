import React from "react";
import APIModuleConfig from "../components/APIModuleConfig";

const APIModuleConfigPage = () => {
  return (
    <div data-testid="api-module-config-page" className="container mx-auto">
      <APIModuleConfig data-testid="api-module-config" />
    </div>
  );
};

export default APIModuleConfigPage;
