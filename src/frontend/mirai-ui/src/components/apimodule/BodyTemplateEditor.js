import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  AlertTitle,
  Divider,
  Tooltip,
  IconButton,
  Link
} from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import InfoIcon from '@mui/icons-material/Info';
import CodeIcon from '@mui/icons-material/Code';

const BodyTemplateEditor = ({ bodyTemplate, setBodyTemplate, method }) => {
  // Only show for methods that support a request body
  const showBodyEditor = ['POST', 'PUT', 'PATCH'].includes(method);
  
  if (!showBodyEditor) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <AlertTitle>Body Template Not Applicable</AlertTitle>
        The {method} method typically doesn't include a request body. Body templates are only used for POST, PUT, and PATCH requests.
      </Alert>
    );
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(bodyTemplate || '{}');
      setBodyTemplate(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // If not valid JSON, leave as is
      console.warn('Could not format JSON, not valid');
    }
  };

  const validateJson = () => {
    if (!bodyTemplate) return true;
    
    try {
      JSON.parse(bodyTemplate);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isValidJson = validateJson();

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Typography variant="h6" display="flex" alignItems="center">
          Request Body Template
          <Tooltip title="The body template defines the JSON payload that will be sent to the API endpoint.">
            <IconButton size="small" color="info" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FormatAlignLeftIcon />}
          onClick={formatJson}
          disabled={!bodyTemplate}
        >
          Format JSON
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>What is a Body Template?</AlertTitle>
        <Typography variant="body2" paragraph>
          The body template defines the JSON payload that will be sent to the API when using POST, PUT, or PATCH methods.
          It allows you to send structured data to the API endpoint, which can include variables from user queries.
        </Typography>
        <Typography variant="body2">
          <strong>How it works:</strong> Variables captured from user queries can be embedded in your JSON body template.
          When a user asks a question that matches a trigger phrase, the variables are extracted and inserted into this template
          before sending the request to the API.
        </Typography>
      </Alert>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={10}
          label="JSON Body Template"
          value={bodyTemplate || ''}
          onChange={(e) => setBodyTemplate(e.target.value)}
          placeholder={`{
  "query": "{'{search_term}'}",
  "options": {
    "limit": 10
  }
}`}
          error={bodyTemplate && !isValidJson}
          helperText={bodyTemplate && !isValidJson ? "Invalid JSON format" : ""}
          InputProps={{
            sx: { 
              fontFamily: 'monospace',
              '& .MuiInputBase-input::placeholder': {
                color: 'text.secondary',
                opacity: 0.8
              }
            }
          }}
        />
      </Box>
      
      <Paper sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CodeIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" color="primary.main" fontWeight="medium">
            Example: Weather API
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            1. Trigger phrase:
          </Typography>
          <Paper sx={{ 
            p: 1.5, 
            bgcolor: 'grey.100', 
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
            What's the weather in {'{city}'}?
          </Paper>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            2. Body template:
          </Typography>
          <Paper sx={{ 
            p: 1.5, 
            bgcolor: 'grey.100', 
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
{`{
  "location": "{'{city}'}",
  "units": "metric",
  "language": "en"
}`}
          </Paper>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            3. When user asks "What's the weather in London?":
          </Typography>
          <Paper sx={{ 
            p: 1.5, 
            bgcolor: 'grey.100', 
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
{`{
  "location": "London",
  "units": "metric",
  "language": "en"
}`}
          </Paper>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            This JSON will be sent as the request body to the API endpoint.
          </Typography>
        </Box>
      </Paper>
      
      <Paper sx={{ mt: 3, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="subtitle2" color="primary.main" gutterBottom>
          Tips for using body templates:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
          <Box component="li" sx={{ mb: 0.5, typography: 'body2' }}>
            Make sure your JSON is valid. Use the "Format JSON" button to validate and format it.
          </Box>
          <Box component="li" sx={{ mb: 0.5, typography: 'body2' }}>
            Use variable placeholders like <code>{'{variable_name}'}</code> to insert values from user queries.
          </Box>
          <Box component="li" sx={{ mb: 0.5, typography: 'body2' }}>
            Variable names should match the placeholders defined in your trigger phrases.
          </Box>
          <Box component="li" sx={{ typography: 'body2' }}>
            For simple APIs, you may not need a complex body template - just the essential fields.
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default BodyTemplateEditor; 