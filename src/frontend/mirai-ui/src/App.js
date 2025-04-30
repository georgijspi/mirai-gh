import "./tailwind.css";
import { useState } from "react";
import { createTheme, ThemeProvider, Box, CssBaseline, Toolbar } from '@mui/material';
import Navigation from "./components/Navigation";
import ChatNowPage from "./pages/ChatNowPage";
import APIModuleConfigPage from "./pages/APIModuleConfigPage";
import SettingsPage from "./pages/SettingsPage";
import TestUIPage from "./pages/TestUIPage";
import AgentConfigurationPage from "./pages/AgentConfigurationPage";
import ConversationsPage from "./pages/ConversationsPage";
import Statistics from "./pages/Statistics";

// Create a dark theme for the entire app
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#ce93d8',
    },
    success: {
      main: '#66bb6a',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1a1a',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(144, 202, 249, 0.16)',
          },
        },
      },
    },
  },
});

function App() {
  const [selectedTab, setSelectedTab] = useState("ChatNow");
  const [APITest, setAPITest] = useState(false);
  const [config, setConfig] = useState({
    keywordModel: "Alexa",
    leopardModelPublicPath: "/models/leopard_params.pv",
    porcupineModelPublicPath: "/models/porcupine_params.pv",
    accessKey: "",
    useCustomKeyword: false,
    customKeywordModelPath: "",
  });

  const handleConfigChange = (newConfig) => {
    console.log("Updating config:", newConfig);
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }));
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  const handleToggleApiTest = () => {
    setAPITest(!APITest);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Navigation 
          activeTab={selectedTab} 
          onChangeTab={handleTabChange} 
          apiTestActive={APITest}
          onToggleApiTest={handleToggleApiTest}
        />
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 0, md: 3 },
            backgroundColor: selectedTab === "Statistics" ? '#121212' : '#121212',
            overflow: 'auto',
            width: '100%'
          }}
        >
          {/* Mobile toolbar spacer */}
          <Toolbar sx={{ display: { xs: 'block', md: 'none' }, minHeight: '64px' }} />
          
          {APITest && <TestUIPage />}
          
          <Box sx={{ maxWidth: '100%', height: '100%' }}>
            {selectedTab === "ChatNow" && <ChatNowPage config={config} />}
            {selectedTab === "Settings" && (
              <SettingsPage onConfigChange={handleConfigChange} config={config} />
            )}
            {selectedTab === "APIModuleConfig" && <APIModuleConfigPage />}
            {selectedTab === "AgentConfiguration" && <AgentConfigurationPage />}
            {selectedTab === "Conversations" && <ConversationsPage />}
            {selectedTab === "Statistics" && <Statistics />}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
