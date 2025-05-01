import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Alert, 
  AlertTitle,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CodeIcon from '@mui/icons-material/Code';

const TestResultView = ({ result }) => {
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [expandFormatted, setExpandFormatted] = useState(false);
  const [expandRawResponse, setExpandRawResponse] = useState(false);
  
  if (!result) {
    return null;
  }

  const toggleRawResponse = () => {
    setShowRawResponse(!showRawResponse);
  };

  const toggleExpandFormatted = () => {
    setExpandFormatted(!expandFormatted);
  };

  const toggleExpandRawResponse = () => {
    setExpandRawResponse(!expandRawResponse);
  };

  // Process 'found' field from process-query endpoint
  const isQueryResult = 'found' in result;
  const isQuerySuccessful = isQueryResult && result.found === true;
  
  // Handle case where result is from process-query endpoint
  if (isQueryResult) {
    if (!isQuerySuccessful) {
      return (
        <Box mt={3}>
          <Typography variant="subtitle1" fontWeight="medium" mb={1}>
            Test Results:
          </Typography>
          <Alert severity="warning" variant="outlined">
            <AlertTitle>No Matching API Module Found</AlertTitle>
            <Typography variant="body2">
              {result.message || "No API module was matched to this query."}
            </Typography>
            <Typography variant="body2" mt={1}>
              Try adjusting your trigger phrases to match this query.
            </Typography>
          </Alert>
        </Box>
      );
    }
    
    // For successful query match, get the actual result object
    result = result.result;
  }

  // Check if formatting failed but API call was successful
  const hasFormattingError = result.success && !result.formatted_response && 
                            result.raw_response && Object.keys(result.raw_response).length > 0;

  // Determine if response is large (more than 2000 characters)
  const isRawResponseLarge = result.raw_response && 
    JSON.stringify(result.raw_response, null, 2).length > 2000;
  
  // Format the raw response for display
  const formatRawResponse = () => {
    try {
      if (!result.raw_response) return "";
      
      // For large responses, provide a preview + expand/collapse
      const responseStr = JSON.stringify(result.raw_response, null, 2);
      
      if (isRawResponseLarge && !expandRawResponse) {
        return responseStr.substring(0, 2000) + "...";
      }
      
      return responseStr;
    } catch (e) {
      return String(result.raw_response);
    }
  };

  return (
    <Box mt={3}>
      <Typography variant="subtitle1" fontWeight="medium" mb={1}>
        Test Results:
      </Typography>
      
      {result.success ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            border: 1, 
            borderColor: hasFormattingError ? 'warning.light' : 'success.light', 
            bgcolor: hasFormattingError ? 'warning.lighter' : 'success.lighter',
            borderRadius: 1
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              {hasFormattingError ? (
                <>
                  <WarningAmberIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="warning.main" fontWeight="medium">
                    Success with Formatting Warning
                  </Typography>
                </>
              ) : (
                <>
                  <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="success.main" fontWeight="medium">
                    Success
                  </Typography>
                </>
              )}
            </Box>
            <Box display="flex" alignItems="center">
              <Chip 
                size="small" 
                label={`${result.status_code} ${result.status_text}`} 
                color="primary" 
                variant="outlined"
                sx={{ mr: 1, height: 24 }}
              />
              <Box display="flex" alignItems="center">
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                <Typography variant="caption" color="text.secondary">
                  {result.execution_time.toFixed(2)}s
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {result.matched_trigger && (
            <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }} variant="outlined">
              <Typography variant="caption">
                Matched trigger phrase: <strong>"{result.matched_trigger}"</strong>
              </Typography>
            </Alert>
          )}
          
          {hasFormattingError && (
            <Alert severity="warning" sx={{ mt: 1.5 }} variant="outlined">
              <AlertTitle>Response Formatting Error</AlertTitle>
              <Typography variant="body2">
                The API call was successful, but there was an error formatting the response.
                This may happen if the result template doesn't match the structure of the API response.
              </Typography>
              <Typography variant="body2" fontWeight="medium" mt={1}>
                Please check the raw response below to see the actual data returned by the API.
              </Typography>
            </Alert>
          )}
          
          {result.formatted_response && (
            <Box mt={2} sx={{ position: 'relative' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" fontWeight="medium">
                  Formatted Response:
                </Typography>
                <Tooltip title={expandFormatted ? "Collapse" : "Expand"}>
                  <IconButton 
                    size="small" 
                    onClick={toggleExpandFormatted}
                    sx={{ 
                      color: 'primary.main',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      zIndex: 2
                    }}
                  >
                    {expandFormatted ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  bgcolor: 'background.paper',
                  maxHeight: expandFormatted ? 'none' : '200px',
                  overflow: expandFormatted ? 'visible' : 'auto',
                  position: 'relative',
                  transition: 'max-height 0.3s ease-in-out'
                }}
              >
                <Typography 
                  variant="body2" 
                  whiteSpace="pre-line"
                  sx={{
                    wordBreak: 'break-word'
                  }}
                >
                  {result.formatted_response}
                </Typography>
              </Paper>
            </Box>
          )}
          
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" fontWeight="medium" display="flex" alignItems="center">
                <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
                Raw Response:
              </Typography>
              <Button 
                size="small" 
                onClick={toggleRawResponse}
                endIcon={showRawResponse ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ typography: 'caption' }}
              >
                {showRawResponse ? "Hide Details" : "Show Details"}
              </Button>
            </Box>
            
            <Collapse in={showRawResponse || hasFormattingError}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  bgcolor: 'background.paper',
                  maxHeight: 320,
                  overflow: 'auto',
                  position: 'relative'
                }}
              >
                {isRawResponseLarge && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    zIndex: 2,
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    borderRadius: '4px'
                  }}>
                    <Tooltip title={expandRawResponse ? "Show Less" : "Show More"}>
                      <IconButton 
                        size="small" 
                        onClick={toggleExpandRawResponse}
                        color="primary"
                      >
                        {expandRawResponse ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {formatRawResponse()}
                </pre>
                {isRawResponseLarge && !expandRawResponse && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    mt: 1, 
                    pt: 1, 
                    borderTop: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <Button 
                      size="small" 
                      onClick={toggleExpandRawResponse}
                      endIcon={<ExpandMoreIcon />}
                      color="primary"
                    >
                      Response is large. Click to show all
                    </Button>
                  </Box>
                )}
              </Paper>
            </Collapse>
          </Box>
        </Paper>
      ) : (
        <Alert 
          severity="error" 
          variant="outlined"
          sx={{ 
            '& .MuiAlert-message': { width: '100%' } 
          }}
        >
          <AlertTitle>Error</AlertTitle>
          <Typography variant="body2">
            {result.error_message || "An unknown error occurred"}
          </Typography>
          
          <Box display="flex" alignItems="center" mt={1}>
            <ErrorOutlineIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption" color="error">
              Status: {result.status_code || "Unknown"} {result.status_text || ""}
            </Typography>
          </Box>
          
          {result.raw_response && Object.keys(result.raw_response).length > 0 && (
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" fontWeight="medium">
                  Error Details:
                </Typography>
                <Button 
                  size="small" 
                  onClick={toggleRawResponse}
                  endIcon={showRawResponse ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ typography: 'caption' }}
                >
                  {showRawResponse ? "Hide Details" : "Show Details"}
                </Button>
              </Box>
              
              <Collapse in={showRawResponse}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'background.paper',
                    mt: 1
                  }}
                >
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify(result.raw_response, null, 2)}
                  </pre>
                </Paper>
              </Collapse>
            </Box>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default TestResultView; 