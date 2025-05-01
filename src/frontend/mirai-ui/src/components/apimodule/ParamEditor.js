import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Tooltip,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import CodeIcon from '@mui/icons-material/Code';
import TextFieldsIcon from '@mui/icons-material/TextFields';

const ParamEditor = ({ params, setParams }) => {
  const addParam = () => {
    setParams([
      ...params,
      {
        name: '',
        param_type: 'CONSTANT',
        value: '',
        description: '',
        placeholder: '',
      }
    ]);
  };

  const updateParam = (index, field, value) => {
    const updatedParams = [...params];
    updatedParams[index][field] = value;
    setParams(updatedParams);
  };

  const removeParam = (index) => {
    setParams(params.filter((_, i) => i !== index));
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
          Parameters
          <Tooltip title="Parameters are values sent to the API endpoint, either in the URL or request body.">
            <IconButton size="small" color="info" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          onClick={addParam}
        >
          Add Parameter
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Understanding Parameters</AlertTitle>
        <Typography variant="body2" paragraph>
          Parameters are key-value pairs sent with your API request. They can be:
        </Typography>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <CodeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Constant Parameters</Typography>
              </Box>
              <Typography variant="body2">
                Fixed values that don't change between requests, like API keys or default settings.
              </Typography>
              <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="caption" component="code" color="#000" sx={{ fontWeight: 'bold' }}>
                  apikey=YOUR_API_KEY
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <TextFieldsIcon color="secondary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Variable Parameters</Typography>
              </Box>
              <Typography variant="body2">
                Dynamic values extracted from user queries using placeholders in trigger phrases.
              </Typography>
              <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="caption" component="code" color="#000" sx={{ fontWeight: 'bold' }}>
                  city=London (from "weather in {'{city}'}")
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        <Typography variant="body2">
          For GET requests, parameters are appended to the URL. For POST/PUT requests, they can be used in the URL 
          or to populate the request body.
        </Typography>
      </Alert>
      
      {params.length === 0 ? (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 2, 
          bgcolor: 'background.paper',
          border: '1px dashed',
          borderColor: 'divider'
        }}>
          <Typography color="text.secondary" mb={2}>
            No parameters defined yet
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            size="medium"
            startIcon={<AddIcon />}
            onClick={addParam}
          >
            Add Your First Parameter
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {params.map((param, index) => (
            <Paper 
              key={index} 
              variant="outlined"
              sx={{ 
                p: 3,
                position: 'relative',
                transition: 'box-shadow 0.2s',
                '&:hover': {
                  boxShadow: 2
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center">
                  <Typography variant="subtitle1" fontWeight="medium" color="primary.main">
                    {param.name || 'New Parameter'}
                  </Typography>
                  {param.param_type && (
                    <Chip 
                      size="small" 
                      label={param.param_type === 'CONSTANT' ? 'Constant' : 'Variable'} 
                      color={param.param_type === 'CONSTANT' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ ml: 1, height: 24 }}
                    />
                  )}
                </Box>
                <IconButton 
                  onClick={() => removeParam(index)}
                  color="error"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    size="small"
                    value={param.name}
                    onChange={(e) => updateParam(index, 'name', e.target.value)}
                    placeholder="Parameter name"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel id={`param-type-label-${index}`}>Type</InputLabel>
                    <Select
                      labelId={`param-type-label-${index}`}
                      value={param.param_type}
                      onChange={(e) => updateParam(index, 'param_type', e.target.value)}
                      label="Type"
                      renderValue={(value) => (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {value === 'CONSTANT' ? (
                            <CodeIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                          ) : (
                            <TextFieldsIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                          )}
                          <Typography variant="body2">
                            {value === 'CONSTANT' ? 'Constant' : 'Variable'}
                          </Typography>
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: { width: 'auto', minWidth: '180px' }
                        }
                      }}
                    >
                      <MenuItem value="CONSTANT" sx={{ display: 'flex', alignItems: 'center' }}>
                        <CodeIcon fontSize="small" sx={{ mr: 1, fontSize: 16 }} />
                        Constant
                      </MenuItem>
                      <MenuItem value="VARIABLE" sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextFieldsIcon fontSize="small" sx={{ mr: 1, fontSize: 16 }} />
                        Variable
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {param.param_type === 'CONSTANT' ? (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Value"
                      size="small"
                      value={param.value || ''}
                      onChange={(e) => updateParam(index, 'value', e.target.value)}
                      placeholder="Parameter value"
                      required={param.param_type === 'CONSTANT'}
                      helperText="Fixed value that doesn't change"
                    />
                  </Grid>
                ) : (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Placeholder"
                      size="small"
                      value={param.placeholder || ''}
                      onChange={(e) => updateParam(index, 'placeholder', e.target.value)}
                      placeholder="e.g. {city}"
                      required={param.param_type === 'VARIABLE'}
                      helperText="Variable name in trigger phrases, like {city}"
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    size="small"
                    value={param.description || ''}
                    onChange={(e) => updateParam(index, 'description', e.target.value)}
                    placeholder="Parameter description"
                    helperText="User-friendly description of this parameter"
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ParamEditor; 