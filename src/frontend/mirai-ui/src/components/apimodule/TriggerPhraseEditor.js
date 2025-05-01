import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  InputAdornment,
  Tooltip,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';

const TriggerPhraseEditor = ({ triggers, setTriggers }) => {
  const [newTrigger, setNewTrigger] = useState('');

  const addTrigger = () => {
    if (!newTrigger.trim()) return;
    
    setTriggers([...triggers, newTrigger.trim()]);
    setNewTrigger('');
  };

  const removeTrigger = (index) => {
    setTriggers(triggers.filter((_, i) => i !== index));
  };

  const updateTrigger = (index, value) => {
    const updatedTriggers = [...triggers];
    updatedTriggers[index] = value;
    setTriggers(updatedTriggers);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newTrigger.trim()) {
      e.preventDefault();
      addTrigger();
    }
  };

  // Highlight variable placeholders in a trigger phrase
  const renderTriggerWithHighlight = (trigger) => {
    const parts = trigger.split(/(\{[^}]+\})/g);
    return parts.map((part, i) => {
      if (part.match(/^\{[^}]+\}$/)) {
        // This is a variable placeholder
        return (
          <Chip 
            key={i} 
            label={part} 
            size="small" 
            color="primary" 
            variant="outlined" 
            sx={{ mx: 0.5, fontSize: '0.75rem', height: 24 }}
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
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
          Trigger Phrases
          <Tooltip title="Trigger phrases are patterns that will activate this API module when a user asks a matching question.">
            <IconButton size="small" color="info" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>What are Trigger Phrases?</AlertTitle>
        <Typography variant="body2">
          Trigger phrases are patterns that match user questions and activate this API module. When a user asks something
          that matches a trigger, the API module will be executed.
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 1 }}>
          <Box component="li" sx={{ typography: 'body2', mb: 0.5 }}>
            Use placeholders like <code>{'{city}'}</code> to extract variables from user queries.
          </Box>
          <Box component="li" sx={{ typography: 'body2', mb: 0.5 }}>
            A trigger can be specific like <code>What's the weather in {'{city}'}</code> or more general like <code>weather {'{city}'}</code>.
          </Box>
          <Box component="li" sx={{ typography: 'body2' }}>
            Add multiple variations of the same question to improve matching accuracy.
          </Box>
        </Box>
      </Alert>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="medium"
          label="Add Trigger Phrase"
          value={newTrigger}
          onChange={(e) => setNewTrigger(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., What's the weather in {'{city}'}?"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addTrigger}
                  disabled={!newTrigger.trim()}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {triggers.length === 0 ? (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 2, 
          bgcolor: 'background.paper',
          border: '1px dashed',
          borderColor: 'divider'
        }}>
          <InfoIcon color="info" sx={{ fontSize: 40, mb: 2, opacity: 0.7 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            No Trigger Phrases Defined
          </Typography>
          <Typography color="text.secondary" mb={2} variant="body2">
            Add trigger phrases to activate this API module when users ask matching questions.
          </Typography>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {triggers.map((trigger, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem sx={{ 
                  py: 1.5, 
                  '&:hover': { 
                    bgcolor: 'action.hover' 
                  }
                }}>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={trigger}
                    onChange={(e) => updateTrigger(index, e.target.value)}
                    InputProps={{
                      disableUnderline: true,
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                            {index + 1}:
                          </Typography>
                        </Box>
                      )
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Delete trigger phrase">
                      <IconButton 
                        edge="end" 
                        size="small"
                        color="error"
                        onClick={() => removeTrigger(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      <Paper sx={{ mt: 3, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <HelpIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="subtitle2" color="primary.main">
            Tips for effective trigger phrases:
          </Typography>
        </Box>
        <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
          <Box component="li" sx={{ mb: 0.5, typography: 'body2' }}>
            Simple phrases like "weather" will match any query containing that word
          </Box>
          <Box component="li" sx={{ mb: 0.5, typography: 'body2' }}>
            Make triggers specific enough to avoid accidental activation
          </Box>
          <Box component="li" sx={{ mb: 0.5, typography: 'body2' }}>
            Use placeholders consistently (e.g. always use <code>{'{city}'}</code> for city names)
          </Box>
          <Box component="li" sx={{ typography: 'body2' }}>
            Include variations: "weather in {'{city}'}", "what's the weather like in {'{city}'}?"
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TriggerPhraseEditor; 