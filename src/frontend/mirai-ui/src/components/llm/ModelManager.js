import React, { useState, useEffect } from "react";
import {
  fetchAvailableModels,
  pullModel,
  deleteModel,
} from "../../services/llmService";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

const ModelManager = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [newModelName, setNewModelName] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAvailableModels();
      
      // Ensure models is always an array
      if (data && Array.isArray(data.models)) {
        setModels(data.models);
      } else if (data && typeof data === 'object') {
        // If data.models doesn't exist but we have an object response
        // with 'name', 'modified_at', and 'size' properties
        if (Array.isArray(data)) {
          setModels(data);
        } else {
          // Handle object with possible models property
          const modelsArray = data.models || [];
          setModels(Array.isArray(modelsArray) ? modelsArray : []);
        }
      } else {
        // Default to empty array if response format is unexpected
        setModels([]);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      setError("Failed to load models: " + (err.message || "Unknown error"));
      console.error(err);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePullModel = async () => {
    if (!newModelName.trim()) {
      setError("Please enter a model name");
      return;
    }

    try {
      setIsPulling(true);
      setError(null);
      await pullModel(newModelName);
      setMessage(`Model "${newModelName}" pulled successfully`);
      setNewModelName("");
      await loadModels();
    } catch (err) {
      setError(`Failed to pull model: ${err.message || "Unknown error"}`);
      console.error(err);
    } finally {
      setIsPulling(false);
    }
  };

  const handleDeleteModel = async (modelName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the model "${modelName}"?`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await deleteModel(modelName);
      setMessage(`Model "${modelName}" deleted successfully`);
      await loadModels();
    } catch (err) {
      setError(`Failed to delete model: ${err.message || "Unknown error"}`);
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper', mb: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom color="primary">
          Model Management
        </Typography>

        {message && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }} 
            onClose={() => setMessage(null)}
          >
            {message}
          </Alert>
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

        <Box 
          sx={{ 
            mb: 4, 
            p: 2, 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1
          }}
        >
          <Typography variant="h6" gutterBottom>
            Pull New Model
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2 
          }}>
            <TextField
              fullWidth
              variant="outlined"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="Enter model name (e.g., llama2)"
              size="medium"
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handlePullModel}
              disabled={isPulling}
              startIcon={isPulling ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
              sx={{ 
                minWidth: isMobile ? '100%' : '120px',
                height: isMobile ? 'auto' : 56
              }}
            >
              {isPulling ? "Pulling..." : "Pull Model"}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" gutterBottom>
          Available Models
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {models.length === 0 ? (
              <Alert severity="info">No models available</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Modified At</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {models.map((model, index) => (
                      <TableRow key={model.name || `model-${index}`}>
                        <TableCell>{model.name}</TableCell>
                        <TableCell>{formatSize(model.size)}</TableCell>
                        <TableCell>{formatDate(model.modified_at)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteModel(model.name)}
                            disabled={isDeleting}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to format file size
const formatSize = (bytes) => {
  if (bytes === undefined || bytes === null) return "Unknown";
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString || "N/A";
  }
};

export default ModelManager;
