import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  InputAdornment,
  Alert,
  AlertTitle,
  Tooltip,
  Divider,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import HttpIcon from '@mui/icons-material/Http';

const HeadersEditor = ({ headers, setHeaders }) => {
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  const addHeader = () => {
    if (!newHeaderKey.trim()) return;
    
    setHeaders({
      ...headers,
      [newHeaderKey.trim()]: newHeaderValue.trim()
    });
    
    // Reset input fields
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  const removeHeader = (key) => {
    const updatedHeaders = { ...headers };
    delete updatedHeaders[key];
    setHeaders(updatedHeaders);
  };

  const updateHeaderValue = (key, value) => {
    setHeaders({
      ...headers,
      [key]: value
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newHeaderKey.trim()) {
      e.preventDefault();
      addHeader();
    }
  };

  const commonHeaders = [
    { name: 'Content-Type', value: 'application/json' },
    { name: 'Authorization', value: 'Bearer YOUR_TOKEN' },
    { name: 'Accept', value: 'application/json' },
    { name: 'x-api-key', value: 'YOUR_API_KEY' }
  ];

  const addCommonHeader = (name, value) => {
    if (!(name in headers)) {
      setHeaders({
        ...headers,
        [name]: value
      });
    }
  };

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
          HTTP Headers
          <Tooltip title="HTTP headers are key-value pairs sent with each request to the API.">
            <IconButton size="small" color="info" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>About HTTP Headers</AlertTitle>
        <Typography variant="body2" paragraph>
          Headers provide additional information with your API request, such as authentication credentials,
          content type, and API keys.
        </Typography>
        <Typography variant="body2">
          Common examples include:
          <Box component="ul" sx={{ mt: 0.5, mb: 0 }}>
            <Box component="li"><code>Content-Type</code>: Specifies the format of the request body (e.g., application/json)</Box>
            <Box component="li"><code>Authorization</code>: Provides authentication credentials</Box>
            <Box component="li"><code>x-api-key</code>: Some APIs require an API key in the headers</Box>
          </Box>
        </Typography>
      </Alert>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Add New Header
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Header Name"
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Content-Type"
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Value"
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="application/json"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              onClick={addHeader}
              disabled={!newHeaderKey.trim()}
              sx={{ height: '100%' }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Common Headers
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {commonHeaders.map((header) => (
            <Chip
              key={header.name}
              label={header.name}
              variant="outlined"
              color="primary"
              clickable
              onClick={() => addCommonHeader(header.name, header.value)}
              sx={{ 
                '&:hover': { bgcolor: 'primary.lighter' },
                cursor: 'pointer'
              }}
            />
          ))}
        </Box>
      </Paper>
      
      <Typography variant="subtitle2" gutterBottom>
        Current Headers ({Object.keys(headers).length})
      </Typography>
      
      {Object.keys(headers).length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No headers defined yet. Add headers above or click on one of the common headers.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell width="40%"><Typography variant="subtitle2">Header Name</Typography></TableCell>
                <TableCell width="50%"><Typography variant="subtitle2">Value</Typography></TableCell>
                <TableCell width="10%" align="right"><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(headers || {}).map(([key, value]) => (
                <TableRow key={key} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">{key}</Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      value={value}
                      onChange={(e) => updateHeaderValue(key, e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => removeHeader(key)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default HeadersEditor; 