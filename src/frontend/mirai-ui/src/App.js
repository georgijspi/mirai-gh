import "./tailwind.css";
import { useState, useEffect } from "react";
import {
  createTheme,
  ThemeProvider,
  Box,
  CssBaseline,
  Toolbar,
} from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import GlobalChatPage from "./pages/GlobalChatPage";
import APIModuleConfigPage from "./pages/APIModuleConfigPage";
import SettingsPage from "./pages/SettingsPage";
import AgentConfigurationPage from "./pages/AgentConfigurationPage";
import ConversationsPage from "./pages/ConversationsPage";
import Statistics from "./pages/Statistics";
import LandingPage from "./pages/LandingPage";

// Create a dark theme for the entire app
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    secondary: {
      main: "#ce93d8",
    },
    success: {
      main: "#66bb6a",
    },
    error: {
      main: "#f44336",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          border: "1px solid #333",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(144, 202, 249, 0.16)",
          },
        },
      },
    },
  },
});

function MainApp() {
  const [selectedTab, setSelectedTab] = useState("Conversations");
  const [config, setConfig] = useState({
    keywordModel: "Alexa",
    leopardModelPublicPath: "/models/leopard_params.pv",
    porcupineModelPublicPath: "/models/porcupine_params.pv",
    accessKey: "",
    useCustomKeyword: false,
    customKeywordModelPath: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Navigation activeTab={selectedTab} onChangeTab={handleTabChange} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0, md: 3 },
          backgroundColor:
            selectedTab === "Statistics" ? "#121212" : "#121212",
          overflow: "auto",
          width: "100%",
        }}
      >
        {/* Mobile toolbar spacer */}
        <Toolbar
          sx={{ display: { xs: "block", md: "none" }, minHeight: "64px" }}
        />
        <Box sx={{ maxWidth: "100%", height: "100%" }}>
          {selectedTab === "GlobalChat" && <GlobalChatPage config={config} />}
          {selectedTab === "Settings" && (
            <SettingsPage
              onConfigChange={handleConfigChange}
              config={config}
            />
          )}
          {selectedTab === "APIModuleConfig" && <APIModuleConfigPage />}
          {selectedTab === "AgentConfiguration" && <AgentConfigurationPage />}
          {selectedTab === "Conversations" && <ConversationsPage />}
          {selectedTab === "Statistics" && <Statistics />}
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Landing page as the default route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* App pages with navigation sidebar */}
          <Route path="/conversations" element={<MainApp />} />
          <Route path="/global-chat" element={<Navigate to="/conversations" replace />} />
          <Route path="/settings" element={<Navigate to="/conversations" replace />} />
          <Route path="/api-module" element={<Navigate to="/conversations" replace />} />
          <Route path="/agent-config" element={<Navigate to="/conversations" replace />} />
          <Route path="/statistics" element={<Navigate to="/conversations" replace />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
