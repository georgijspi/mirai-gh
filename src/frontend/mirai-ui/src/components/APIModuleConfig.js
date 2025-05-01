import React, { useState, useEffect } from "react";
import ParamEditor from "./apimodule/ParamEditor";
import HeadersEditor from "./apimodule/HeadersEditor";
import TriggerPhraseEditor from "./apimodule/TriggerPhraseEditor";
import BodyTemplateEditor from "./apimodule/BodyTemplateEditor";
import TestResultView from "./apimodule/TestResultView";
import { Box, Typography, Paper, Button, Tabs, Tab, Alert, CircularProgress, Divider, TextField, MenuItem, FormControl, InputLabel, Select, TextareaAutosize } from '@mui/material';

// API configuration for MirAI UI

// Base URL for API requests
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8005/mirai/api";

// WebSocket URL for real-time updates
export const WS_BASE_URL = (() => {
  // Determine if we're using HTTPS to select the appropriate WebSocket protocol
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  if (process.env.REACT_APP_WS_BASE_URL) {
    return process.env.REACT_APP_WS_BASE_URL;
  }

  // Extract hostname and port from API_BASE_URL or use default
  try {
    if (API_BASE_URL) {
      const url = new URL(API_BASE_URL);
      return `${protocol}//${url.hostname}:${url.port || "8005"}/mirai/api/ws`;
    }
  } catch (e) {
    console.error("Failed to parse API_BASE_URL for WebSocket connection:", e);
  }

  // Fallback to default
  return "ws://localhost:8005/mirai/api/ws";
})();

// Default headers for API requests
export const API_HEADERS = {
  "Content-Type": "application/json",
};

// Conversation endpoints
export const CONVERSATION_ENDPOINTS = {
  CREATE: "/conversation",
  LIST: "/conversation/list",
  GET: (conversationId) => `/conversation/${conversationId}`,
  UPDATE: (conversationId) => `/conversation/${conversationId}`,
  DELETE: (conversationId) => `/conversation/${conversationId}`,
  SEND_MESSAGE: "/conversation/send_message",
  RATE_MESSAGE: "/conversation/rate_message",
};

// Global conversation endpoints
export const GLOBAL_CONVERSATION_ENDPOINTS = {
  GET: "/global_conversation",
  SEND_MESSAGE: "/global_conversation/send_message",
  RATE_MESSAGE: "/global_conversation/rate_message",
};

// Agent endpoints
export const AGENT_ENDPOINTS = {
  CREATE: "/agent",
  LIST: "/agent/list",
  GET: (agentId) => `/agent/${agentId}`,
  UPDATE: (agentId) => `/agent/${agentId}`,
  DELETE: (agentId) => `/agent/${agentId}`,
  UPLOAD_VOICE: "/agent/upload_voice",
};

// API Module endpoints
export const API_MODULE_ENDPOINTS = {
  CREATE: "/api-modules",
  LIST: "/api-modules",
  GET: (moduleId) => `/api-modules/${moduleId}`,
  UPDATE: (moduleId) => `/api-modules/${moduleId}`,
  DELETE: (moduleId) => `/api-modules/${moduleId}`,
  TEST: "/api-modules/test",
  PROCESS_QUERY: "/api-modules/process-query",
};

// TTS endpoints
export const TTS_ENDPOINTS = {
  GENERATE: "/tts/generate",
  DOWNLOAD: (messageId, conversationId) =>
    `/tts/download/${messageId}${
      conversationId ? `?conversation_uid=${conversationId}` : ""
    }`,
  STREAM: (messageId, conversationId) =>
    `/tts/stream/${messageId}${
      conversationId ? `?conversation_uid=${conversationId}` : ""
    }`,
  VOICES: "/tts/voices",
};

// WebSocket endpoints
export const WS_ENDPOINTS = {
  GLOBAL: "global",
  CONVERSATION: (conversationId) => `conversation/${conversationId}`,
};

// Generic fetch function for API requests
export const fetchAPI = async (endpoint, options = {}) => {
  try {
    console.log(`Making API request to: ${API_BASE_URL}${endpoint}`, options);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: API_HEADERS,
      mode: "cors",
      credentials: "omit",
      ...options,
    });

    if (!response.ok) {
      console.error(`Request failed with status: ${response.status} ${response.statusText}`);
      
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        console.error('Failed to parse error response as JSON', e);
        errorData = { detail: `Request failed with status ${response.status} ${response.statusText}` };
      }
      
      console.error('Error response data:', errorData);
      
      // Handle both string and object errors
      const errorMessage = 
        typeof errorData?.detail === 'object' 
          ? JSON.stringify(errorData.detail) 
          : errorData?.detail || `API request failed with status ${response.status}`;
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      error.responseData = errorData;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

const APIModuleConfig = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [isTestingModule, setIsTestingModule] = useState(false);

  // Tabs for editing different aspects of the module
  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "headers", label: "Headers" },
    { id: "params", label: "Parameters" },
    { id: "triggers", label: "Triggers" },
    { id: "body", label: "Body Template" },
    { id: "test", label: "Test Module" },
  ];

  // Fetch modules on component mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const response = await fetchAPI(API_MODULE_ENDPOINTS.LIST);
        setModules(response.modules || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch API modules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const createNewModule = () => {
    setCurrentModule({
      name: "New Module",
      description: "",
      base_url: "",
      method: "GET",
      headers: {},
      params: [],
      body_template: "",
      trigger_phrases: []
    });
    setActiveTab("basic");
    setIsEditing(true);
    setTestResult(null);
  };

  const editModule = (module) => {
    setCurrentModule(module);
    setActiveTab("basic");
    setIsEditing(true);
    setTestResult(null);
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this API module?")) {
      return;
    }
    
    try {
      await fetchAPI(API_MODULE_ENDPOINTS.DELETE(moduleId), {
        method: "DELETE"
      });
      
      setModules(modules.filter(m => m.module_uid !== moduleId));
    } catch (err) {
      setError(err.message);
      console.error("Failed to delete API module:", err);
    }
  };

  const saveModule = async () => {
    try {
      const isNew = !currentModule.module_uid;
      const endpoint = isNew 
        ? API_MODULE_ENDPOINTS.CREATE
        : API_MODULE_ENDPOINTS.UPDATE(currentModule.module_uid);
      
      const method = isNew ? "POST" : "PUT";
      
      // Create payload without result_template as LLM will interpret API results directly
      const moduleData = isNew ? currentModule : {
        name: currentModule.name,
        description: currentModule.description,
        base_url: currentModule.base_url,
        method: currentModule.method,
        headers: currentModule.headers,
        params: currentModule.params,
        body_template: currentModule.body_template,
        trigger_phrases: currentModule.trigger_phrases,
        is_active: currentModule.is_active
      };
      
      // Remove result_template if it exists
      if ('result_template' in moduleData) {
        delete moduleData.result_template;
      }
      
      const response = await fetchAPI(endpoint, {
        method,
        body: JSON.stringify(moduleData)
      });
      
      if (isNew) {
        setModules([...modules, response.module]);
      } else {
        setModules(modules.map(m => 
          m.module_uid === currentModule.module_uid ? response.module : m
        ));
      }
      
      setCurrentModule(response.module);
      setError(null);
      setActiveTab("test");
    } catch (err) {
      setError(err.message);
      console.error("Failed to save API module:", err);
    }
  };

  const cancelEdit = () => {
    setCurrentModule(null);
    setIsEditing(false);
    setTestResult(null);
  };

  const testModule = async () => {
    try {
      setIsTestingModule(true);
      setTestResult(null);
      setError(null);
      
      // Make sure we're sending variables as an empty object
      const result = await fetchAPI(`${API_MODULE_ENDPOINTS.TEST}?module_uid=${currentModule.module_uid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          variables: {} 
        })
      });
      
      setTestResult(result);
    } catch (err) {
      console.error("Failed to test API module:", err);
      
      // Create a more user-friendly test result for errors
      setTestResult({
        success: false,
        error_message: err.message || "Failed to test API module",
        status_code: err.status || 500,
        status_text: err.statusText || "Error",
        raw_response: err.responseData || {}
      });
    } finally {
      setIsTestingModule(false);
    }
  };

  const testWithQuery = async () => {
    try {
      setIsTestingModule(true);
      setTestResult(null);
      setError(null);
      
      // The endpoint is a POST method that expects the query as a query parameter
      const encodedQuery = encodeURIComponent(testQuery);
      const result = await fetchAPI(`${API_MODULE_ENDPOINTS.PROCESS_QUERY}?query=${encodedQuery}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      setTestResult(result);
    } catch (err) {
      console.error("Failed to process query:", err);
      
      // Create a more user-friendly test result for errors
      setTestResult({
        success: false,
        error_message: err.message || "Failed to process query",
        status_code: err.status || 500,
        status_text: err.statusText || "Error",
        raw_response: err.responseData || {}
      });
    } finally {
      setIsTestingModule(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
  return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              value={currentModule.name}
              onChange={(e) => setCurrentModule({...currentModule, name: e.target.value})}
              placeholder="Weather API"
            />
            
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={currentModule.description}
              onChange={(e) => setCurrentModule({...currentModule, description: e.target.value})}
              placeholder="Gets current weather information for a specified location"
            />
            
            <TextField
              label="Base URL"
              variant="outlined"
              fullWidth
              value={currentModule.base_url}
              onChange={(e) => setCurrentModule({...currentModule, base_url: e.target.value})}
              placeholder="https://api.example.com/v1/weather"
            />
            
            <FormControl fullWidth variant="outlined">
              <InputLabel id="http-method-label">HTTP Method</InputLabel>
              <Select
                labelId="http-method-label"
                value={currentModule.method}
                onChange={(e) => setCurrentModule({...currentModule, method: e.target.value})}
                label="HTTP Method"
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      
      case "headers":
        return (
          <HeadersEditor 
            headers={currentModule.headers || {}} 
            setHeaders={(headers) => setCurrentModule({...currentModule, headers})}
          />
        );
      
      case "params":
        return (
          <ParamEditor 
            params={currentModule.params || []} 
            setParams={(params) => setCurrentModule({...currentModule, params})}
          />
        );
      
      case "triggers":
        return (
          <TriggerPhraseEditor 
            triggers={currentModule.trigger_phrases || []} 
            setTriggers={(trigger_phrases) => setCurrentModule({...currentModule, trigger_phrases})}
          />
        );
      
      case "body":
        return (
          <BodyTemplateEditor 
            bodyTemplate={currentModule.body_template || ""}
            setBodyTemplate={(body_template) => setCurrentModule({...currentModule, body_template})}
            method={currentModule.method}
          />
        );
      
      case "test":
        return (
          <Box>
            <Typography variant="h6" mb={2}>
              Test Module
            </Typography>
            
            {currentModule.module_uid ? (
              <>
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Test with a trigger phrase:
                  </Typography>
                  <Box sx={{ display: 'flex', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      placeholder="What's the weather in London?"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          borderRight: 'none',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={testWithQuery}
                      disabled={isTestingModule || !testQuery.trim()}
                      sx={{ 
                        borderTopLeftRadius: 0, 
                        borderBottomLeftRadius: 0,
                        px: 3
                      }}
                    >
                      {isTestingModule ? "Testing..." : "Test Query"}
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Enter a query that should match one of your trigger phrases
                  </Typography>
                </Box>
                
                <Box textAlign="center" my={2}>
                  <Divider>
                    <Typography variant="caption" color="text.secondary">OR</Typography>
                  </Divider>
                </Box>
                
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Test direct API execution:
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={testModule}
                    disabled={isTestingModule}
                    sx={{ py: 1 }}
                  >
                    {isTestingModule ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Testing...
                      </Box>
                    ) : (
                      "Test Direct Execution"
                    )}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Executes the API directly without trigger phrase matching
                  </Typography>
                </Box>
                
                <TestResultView result={testResult} />
              </>
            ) : (
              <Alert severity="info">
                Please save the module first before testing.
              </Alert>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" ml={2}>
          Loading API modules...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        API Module Configuration
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          variant="outlined" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {isEditing ? (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" fontWeight="semibold" mb={2}>
            {currentModule.module_uid ? `Edit Module: ${currentModule.name}` : "Create New API Module"}
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((tab) => (
                <Tab key={tab.id} label={tab.label} value={tab.id} />
              ))}
            </Tabs>
          </Box>
          
          <Box mb={3}>
            {renderTabContent()}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              onClick={saveModule}
              color="primary"
            >
              Save Module
            </Button>
            <Button
              variant="outlined"
              onClick={cancelEdit}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <Button
            variant="contained"
            color="success"
            onClick={createNewModule}
            sx={{ mb: 3 }}
          >
            Create New API Module
          </Button>
          
          {modules.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="medium" mb={2}>
                No API Modules Yet
              </Typography>
              <Typography color="text.secondary" mb={3}>
                Create your first API module to integrate external data sources into your conversations.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={createNewModule}
              >
                Create Module
              </Button>
            </Paper>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 3
            }}>
              {modules.map((module) => (
                <Paper 
                  key={module.module_uid} 
                  elevation={1}
                  sx={{ p: 2 }}
                >
                  <Typography variant="h6" fontWeight="semibold" mb={1}>
                    {module.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2} sx={{ minHeight: '3em' }}>
                    {module.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {module.method} {module.base_url}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" fontWeight="medium" mb={0.5}>
                      Trigger Phrases:
                    </Typography>
                    <Box component="ul" sx={{ ml: 2, mb: 0, pl: 1 }}>
                      {module.trigger_phrases.slice(0, 3).map((phrase, idx) => (
                        <Box component="li" key={idx} sx={{ fontSize: '0.75rem' }}>
                          {phrase}
                        </Box>
                      ))}
                      {module.trigger_phrases.length > 3 && (
                        <Box component="li" sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                          +{module.trigger_phrases.length - 3} more...
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => editModule(module)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={() => {
                        setCurrentModule(module);
                        setActiveTab("test");
                        setIsEditing(true);
                      }}
                    >
                      Test
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => deleteModule(module.module_uid)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default APIModuleConfig;
