import React, { useState, useEffect } from 'react';
import { getPicovoiceAccessKey, setPicovoiceAccessKey } from '../services/settingsService';
import { API_BASE_URL } from '../config/apiConfig';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Link,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Save as SaveIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

const Settings = () => {
  const [accessKey, setAccessKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchAccessKey = async () => {
      try {
        setLoading(true);
        const key = await getPicovoiceAccessKey();
        console.log("Settings: Loaded access key from server:", key ? "Present" : "Not found");
        if (key) {
          setAccessKey(key);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading access key:', err);
        setError('Failed to load access key from server: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchAccessKey();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log("Settings: Saving access key to server");
      await setPicovoiceAccessKey(accessKey);
      console.log("Settings: Access key saved successfully");
      setSaved(true);
      setError(null);
      setTimeout(() => {
        setSaved(false);
      }, 5000);
    } catch (err) {
      console.error('Error saving access key:', err);
      setError('Failed to save access key to server: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper', mb: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom color="primary">
          API Access Keys
        </Typography>

        {saved && (
          <Fade in={saved}>
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              onClose={() => setSaved(false)}
            >
              Settings saved successfully! Please refresh the page for changes to take effect.
            </Alert>
          </Fade>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <KeyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h3">
              Voice Recognition
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Picovoice Access Key"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Enter your Picovoice access key here"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Required for speech recognition and wakeword detection. Get your key at{" "}
              <Link
                href="https://console.picovoice.ai/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'inline-flex', alignItems: 'center' }}
              >
                console.picovoice.ai
                <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />
              </Link>
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Access Key'}
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Other API Keys
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body2" color="textSecondary">
            Additional API keys for other services can be configured here in the future.
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default Settings; 