import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider,
  createTheme,
  ThemeProvider,
  Alert
} from '@mui/material';
import { 
  BarChart, 
  PieChart,
  ScatterChart,
  LineChart
} from '@mui/x-charts';
import { 
  getMessageStatistics,
  getLlmStatistics,
  getAgentStatistics,
  getResponseMetrics
} from '../services/statisticsService';
import { fetchAPI, ENDPOINTS } from '../config/api.config';
import { API_BASE_URL } from '../config/apiConfig';

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
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#b0b0b0',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#b0b0b0',
        },
      },
    },
  },
});

const Statistics = () => {
  const [messageStats, setMessageStats] = useState(null);
  const [responseMetrics, setResponseMetrics] = useState(null);
  const [llmStats, setLlmStats] = useState(null);
  const [agentStats, setAgentStats] = useState(null);
  
  const [agents, setAgents] = useState([]);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedLlm, setSelectedLlm] = useState('all');
  
  const [loadingMessageStats, setLoadingMessageStats] = useState(true);
  const [loadingResponseMetrics, setLoadingResponseMetrics] = useState(true);
  const [loadingLlmStats, setLoadingLlmStats] = useState(true);
  const [loadingAgentStats, setLoadingAgentStats] = useState(true);
  const [loadingAgentOptions, setLoadingAgentOptions] = useState(true);
  const [loadingLlmOptions, setLoadingLlmOptions] = useState(true);
  
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadFilters = async () => {
      try {
        setLoadingAgentOptions(true);
        setLoadingLlmOptions(true);
        
        const agentData = await fetchAPI(ENDPOINTS.AGENT.LIST);
        console.log("Loaded agents data:", agentData);
        if (agentData && agentData.agents) {
          setAgents(agentData.agents || []);
        }
        setLoadingAgentOptions(false);
        
        const llmData = await fetchAPI(ENDPOINTS.LLM.CONFIG);
        console.log("Loaded LLM config data:", llmData);
        
        if (Array.isArray(llmData)) {
          setLlmConfigs(llmData);
        } else if (llmData && llmData.configs) {
          setLlmConfigs(llmData.configs || []);
        } else {
          setLlmConfigs([]);
        }
        setLoadingLlmOptions(false);
      } catch (error) {
        console.error("Error loading filters:", error);
        setError(`Failed to load dropdown options: ${error.message}`);
        setLoadingAgentOptions(false);
        setLoadingLlmOptions(false);
      }
    };
    
    loadFilters();
  }, []);
  
  useEffect(() => {
    const loadStatistics = async () => {
      const agentFilter = selectedAgent === 'all' ? null : selectedAgent;
      const llmFilter = selectedLlm === 'all' ? null : selectedLlm;
      
      try {
        setLoadingMessageStats(true);
        const messageStatsData = await getMessageStatistics(llmFilter, agentFilter);
        setMessageStats(messageStatsData);
        setLoadingMessageStats(false);
        
        setLoadingResponseMetrics(true);
        const metricsData = await getResponseMetrics(llmFilter, agentFilter);
        console.log("Response metrics data:", metricsData);
        setResponseMetrics(metricsData);
        setLoadingResponseMetrics(false);
        
        setLoadingLlmStats(true);
        const llmStatsData = await getLlmStatistics(llmFilter);
        setLlmStats(llmStatsData);
        setLoadingLlmStats(false);
        
        setLoadingAgentStats(true);
        const agentStatsData = await getAgentStatistics(agentFilter);
        setAgentStats(agentStatsData);
        setLoadingAgentStats(false);
      } catch (error) {
        console.error("Error loading statistics:", error);
        setError(`Failed to load statistics: ${error.message}`);
        setLoadingMessageStats(false);
        setLoadingResponseMetrics(false);
        setLoadingLlmStats(false);
        setLoadingAgentStats(false);
      }
    };
    
    loadStatistics();
  }, [selectedAgent, selectedLlm]);
  
  const handleAgentChange = (event) => {
    setSelectedAgent(event.target.value);
  };
  
  const handleLlmChange = (event) => {
    setSelectedLlm(event.target.value);
  };
  
  const renderMessageStatsChart = () => {
    if (loadingMessageStats) {
      return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
    }
    
    if (!messageStats) {
      return <Typography color="text.secondary">No message statistics available</Typography>;
    }
    
    const data = [
      { id: 0, value: messageStats.likes || 0, label: 'Likes', color: darkTheme.palette.success.main },
      { id: 1, value: messageStats.dislikes || 0, label: 'Dislikes', color: darkTheme.palette.error.main },
      { id: 2, value: messageStats.no_rating || 0, label: 'No Rating', color: darkTheme.palette.grey[500] }
    ];
    
    const total = messageStats.total || 0;
    
    if (total === 0) {
      return <Typography color="text.secondary" align="center">No message ratings available for the selected filter</Typography>;
    }
    
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <PieChart
          series={[
            {
              data,
              highlightScope: { faded: 'global', highlighted: 'item' },
              faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
              valueFormatter: (v) => `${v.value} (${total > 0 ? ((v.value / total) * 100).toFixed(1) : 0}%)`,
            },
          ]}
          width={300}
          height={200}
          margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'bottom', horizontal: 'middle' },
              padding: 0,
              labelstyle: {
                fill: darkTheme.palette.text.primary,
              },
            },
          }}
        />
        <Typography variant="body2" color="text.secondary" mt={1}>
          Total Messages: {total}
        </Typography>
      </Box>
    );
  };
  
  const renderResponseMetricsChart = () => {
    if (loadingResponseMetrics) {
      return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
    }
    
    if (!responseMetrics || !Array.isArray(responseMetrics) || responseMetrics.length === 0) {
      return <Typography color="text.secondary" align="center">No response metrics available for the selected filter</Typography>;
    }
    
    const data = responseMetrics.map((metric, index) => ({
      id: index,
      x: metric.response_time || 0,
      y: metric.audio_duration || 0,
      size: Math.min(metric.char_count / 100 || 5, 30),
    }));
    
    let filterDescription = 'All agents and LLMs';
    if (selectedAgent !== 'all' && selectedLlm !== 'all') {
      const agentName = agents.find(a => a.agent_uid === selectedAgent)?.name || 'Unknown agent';
      const llmName = llmConfigs.find(l => l.llm_config_uid === selectedLlm || l.config_uid === selectedLlm)?.name || 'Unknown LLM';
      filterDescription = `${agentName} with ${llmName}`;
    } else if (selectedAgent !== 'all') {
      filterDescription = agents.find(a => a.agent_uid === selectedAgent)?.name || 'Unknown agent';
    } else if (selectedLlm !== 'all') {
      filterDescription = llmConfigs.find(l => l.llm_config_uid === selectedLlm || l.config_uid === selectedLlm)?.name || 'Unknown LLM';
    }
    
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="subtitle2" color="text.secondary" align="center" gutterBottom>
          Filtered by: {filterDescription}
        </Typography>
        <ScatterChart
          series={[
            {
              data,
              label: 'Response Time vs Audio Duration',
              valueFormatter: ({ x, y }) => `Response Time: ${x.toFixed(2)}s, Audio Duration: ${y.toFixed(2)}s`,
              color: darkTheme.palette.primary.main,
            },
          ]}
          xAxis={[
            {
              label: 'Response Time (s)',
              min: 0,
              tickLabelStyle: {
                fill: darkTheme.palette.text.primary,
              },
              labelstyle: {
                fill: darkTheme.palette.text.primary,
              },
            },
          ]}
          yAxis={[
            {
              label: 'Audio Duration (s)',
              min: 0,
              tickLabelStyle: {
                fill: darkTheme.palette.text.primary,
              },
              labelstyle: {
                fill: darkTheme.palette.text.primary,
              },
            },
          ]}
          width={300}
          height={200}
          margin={{ left: 60, right: 20, top: 5, bottom: 50 }}
          slotProps={{
            legend: {
              labelstyle: {
                fill: darkTheme.palette.text.primary,
              },
            },
          }}
        />
      </Box>
    );
  };
  
  const renderLlmStatsChart = () => {
    if (loadingLlmStats) {
      return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
    }
    
    if (!llmStats || !Array.isArray(llmStats) || llmStats.length === 0) {
      return <Typography color="text.secondary" align="center">No LLM statistics available for the selected filter</Typography>;
    }
    
    const enhancedLlmStats = llmStats.map(stat => {
      const llmConfig = llmConfigs.find(config => config.llm_config_uid === stat._id || config.config_uid === stat._id);
      return {
        ...stat,
        name: llmConfig ? llmConfig.name : `LLM ${stat._id ? stat._id.substring(0, 8) : 'Unknown'}...`
      };
    });
    
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <BarChart
          series={[
            {
              data: enhancedLlmStats.map(stat => stat.avg_response_time || 0),
              label: 'Avg Response Time (s)',
              color: darkTheme.palette.primary.main
            },
            {
              data: enhancedLlmStats.map(stat => stat.message_count || 0),
              label: 'Message Count',
              color: darkTheme.palette.secondary.main
            }
          ]}
          xAxis={[
            {
              data: enhancedLlmStats.map(stat => stat.name),
              scaleType: 'band',
              tickLabelStyle: {
                fill: darkTheme.palette.text.primary,
                angle: 45,
                textAnchor: 'start',
                fontSize: 10,
              },
            }
          ]}
          width={300}
          height={200}
          margin={{ left: 50, right: 20, top: 20, bottom: 80 }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'bottom', horizontal: 'middle' },
              padding: { top: 40 },
              labelstyle: {
                fill: darkTheme.palette.text.primary,
              },
            },
          }}
        />
      </Box>
    );
  };
  
  const renderAgentStatsChart = () => {
    if (loadingAgentStats) {
      return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
    }
    
    if (!agentStats || !Array.isArray(agentStats) || agentStats.length === 0) {
      return <Typography color="text.secondary" align="center">No agent statistics available for the selected filter</Typography>;
    }
    
    const enhancedAgentStats = agentStats.map(stat => {
      const agent = agents.find(a => a.agent_uid === stat._id);
      return {
        ...stat,
        name: agent ? agent.name : `Agent ${stat._id ? stat._id.substring(0, 8) : 'Unknown'}...`
      };
    });
    
    enhancedAgentStats.forEach(stat => {
      const totalRatings = (stat.like_count || 0) + (stat.dislike_count || 0);
      stat.satisfaction_rate = totalRatings > 0 ? ((stat.like_count || 0) / totalRatings) * 100 : 0;
    });
    
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LineChart
          series={[
            {
              data: enhancedAgentStats.map(stat => stat.avg_response_time || 0),
              label: 'Avg Response Time (s)',
              color: darkTheme.palette.primary.main,
              curve: 'linear',
              showMark: true,
            },
            {
              data: enhancedAgentStats.map(stat => stat.satisfaction_rate),
              label: 'Satisfaction Rate (%)',
              color: darkTheme.palette.success.main,
              curve: 'linear',
              showMark: true,
            }
          ]}
          xAxis={[
            {
              data: enhancedAgentStats.map(stat => stat.name),
              scaleType: 'point',
              tickLabelStyle: {
                fill: darkTheme.palette.text.primary,
                angle: 45,
                textAnchor: 'start',
                fontSize: 10,
              },
            }
          ]}
          width={300}
          height={200}
          margin={{ left: 50, right: 20, top: 20, bottom: 80 }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'bottom', horizontal: 'middle' },
              padding: { top: 40 },
              labelstyle: {
                fill: darkTheme.palette.text.primary,
              },
            },
          }}
        />
      </Box>
    );
  };
  
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100%', py: 4 }}>
        <Container maxWidth="xl">
          <Typography variant="h4" component="h1" gutterBottom color="text.primary">
            Statistics Dashboard
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }} elevation={3}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ width: '100%', px: { xs: 0.5, md: 1 }, mb: { xs: 2, md: 0 } }}>
                <FormControl fullWidth>
                  <InputLabel id="agent-select-label" sx={{ color: 'text.secondary' }}>Agent</InputLabel>
                  <Select
                    labelId="agent-select-label"
                    id="agent-select"
                    value={selectedAgent}
                    label="Agent"
                    onChange={handleAgentChange}
                    disabled={loadingAgentOptions}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'background.paper',
                          maxHeight: 300,
                        },
                      },
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '14px 16px',
                      },
                    }}
                  >
                    <MenuItem value="all">All Agents ({agents.length})</MenuItem>
                    {agents.map((agent) => (
                      <MenuItem key={agent.agent_uid} value={agent.agent_uid}>
                        {agent.name || 'Unnamed Agent'}
                      </MenuItem>
                    ))}
                    {agents.length === 0 && !loadingAgentOptions && (
                      <MenuItem disabled>No agents available</MenuItem>
                    )}
                    {loadingAgentOptions && (
                      <MenuItem disabled>Loading agents...</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: '100%', px: { xs: 0.5, md: 1 } }}>
                <FormControl fullWidth>
                  <InputLabel id="llm-select-label" sx={{ color: 'text.secondary' }}>LLM Configuration</InputLabel>
                  <Select
                    labelId="llm-select-label"
                    id="llm-select"
                    value={selectedLlm}
                    label="LLM Configuration"
                    onChange={handleLlmChange}
                    disabled={loadingLlmOptions}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'background.paper',
                          maxHeight: 300,
                        },
                      },
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '14px 16px',
                      },
                    }}
                  >
                    <MenuItem value="all">All LLMs ({llmConfigs.length})</MenuItem>
                    {llmConfigs.map((config) => (
                      <MenuItem key={config.llm_config_uid || config.config_uid} value={config.llm_config_uid || config.config_uid}>
                        {config.name || 'Unnamed Config'}
                      </MenuItem>
                    ))}
                    {llmConfigs.length === 0 && !loadingLlmOptions && (
                      <MenuItem disabled>No LLM configurations available</MenuItem>
                    )}
                    {loadingLlmOptions && (
                      <MenuItem disabled>Loading LLM configurations...</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1 }}>
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 0.5, md: 1 }, height: { xs: '350px', md: '400px' } }}>
              <Card elevation={4} sx={{ height: '100%', borderRadius: 2 }}>
                <CardHeader 
                  title="Message Ratings" 
                  subheader="Likes, dislikes, and no ratings"
                  titleTypographyProps={{ color: 'text.primary', variant: 'h6' }}
                  subheaderTypographyProps={{ color: 'text.secondary' }}
                  sx={{ p: { xs: 2, md: 3 } }}
                />
                <Divider sx={{ borderColor: 'divider' }} />
                <CardContent sx={{ height: 'calc(100% - 85px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 2 } }}>
                  {renderMessageStatsChart()}
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 0.5, md: 1 }, height: { xs: '350px', md: '400px' } }}>
              <Card elevation={4} sx={{ height: '100%', borderRadius: 2 }}>
                <CardHeader 
                  title="Response Metrics" 
                  subheader="Response time vs audio duration"
                  titleTypographyProps={{ color: 'text.primary', variant: 'h6' }}
                  subheaderTypographyProps={{ color: 'text.secondary' }}
                  sx={{ p: { xs: 2, md: 3 } }}
                />
                <Divider sx={{ borderColor: 'divider' }} />
                <CardContent sx={{ height: 'calc(100% - 85px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 2 } }}>
                  {renderResponseMetricsChart()}
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 0.5, md: 1 }, height: { xs: '350px', md: '400px' } }}>
              <Card elevation={4} sx={{ height: '100%', borderRadius: 2 }}>
                <CardHeader 
                  title="LLM Performance" 
                  subheader="Average response time and message count by LLM"
                  titleTypographyProps={{ color: 'text.primary', variant: 'h6' }}
                  subheaderTypographyProps={{ color: 'text.secondary' }}
                  sx={{ p: { xs: 2, md: 3 } }}
                />
                <Divider sx={{ borderColor: 'divider' }} />
                <CardContent sx={{ height: 'calc(100% - 85px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 2 } }}>
                  {renderLlmStatsChart()}
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 0.5, md: 1 }, height: { xs: '350px', md: '400px' } }}>
              <Card elevation={4} sx={{ height: '100%', borderRadius: 2 }}>
                <CardHeader 
                  title="Agent Performance" 
                  subheader="Response time and satisfaction rate by agent"
                  titleTypographyProps={{ color: 'text.primary', variant: 'h6' }}
                  subheaderTypographyProps={{ color: 'text.secondary' }}
                  sx={{ p: { xs: 2, md: 3 } }}
                />
                <Divider sx={{ borderColor: 'divider' }} />
                <CardContent sx={{ height: 'calc(100% - 85px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, md: 2 } }}>
                  {renderAgentStatsChart()}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Statistics; 