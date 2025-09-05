import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Paper,
  Chip,
  Alert,
  Autocomplete,
  Divider,
} from '@mui/material';
import { Search as SearchIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { searchModels, loadModelFromHub, SUGGESTED_MODELS } from '../utils/huggingface';
import type { ModelPreset } from '../types/calculator';

interface HuggingFaceModelSearchProps {
  onModelLoad: (model: ModelPreset) => void;
  onError?: (error: string) => void;
}

interface ModelSearchResult {
  id: string;
  downloads?: number;
  likes?: number;
  pipeline_tag?: string;
  tags?: string[];
}

export const HuggingFaceModelSearch: React.FC<HuggingFaceModelSearchProps> = ({
  onModelLoad,
  onError
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Memoized suggested models for autocomplete
  const suggestedModelsOptions = useMemo(() => SUGGESTED_MODELS.map(model => ({
    label: model,
    value: model
  })), []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const results = await searchModels(query, {
        limit: 10,
        sort: 'downloads',
        direction: -1,
        filter: 'text-generation'
      });

      setSearchResults(results.models || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [onError]);

  const handleLoadModel = useCallback(async (modelId: string) => {
    setIsLoading(true);
    setError('');

    try {
      const model = await loadModelFromHub(modelId);
      // Add HF Hub metadata
      const enhancedModel: ModelPreset = {
        ...model,
        isFromHub: true,
        hubUrl: `https://huggingface.co/${modelId}`
      };
      
      onModelLoad(enhancedModel);
      setSelectedModel(modelId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onModelLoad, onError]);

  const handleSearchInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  const formatDownloads = (downloads?: number): string => {
    if (!downloads) return '0';
    if (downloads < 1000) return downloads.toString();
    if (downloads < 1000000) return `${(downloads / 1000).toFixed(1)}K`;
    return `${(downloads / 1000000).toFixed(1)}M`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DownloadIcon />
        Load from Hugging Face Hub
      </Typography>

      {/* Suggested Models Quick Select */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
          Suggested Models
        </Typography>
        <Autocomplete
          options={suggestedModelsOptions}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select a suggested model..."
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              }}
            />
          )}
          onChange={(_, option) => {
            if (option) {
              handleLoadModel(option.value);
            }
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      <Divider>
        <Typography variant="caption" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* Custom Search */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
          Search Custom Model
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search for models (e.g., 'meta-llama/Llama-3.2-1B')..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            endAdornment: isSearching && <CircularProgress size={20} />
          }}
        />
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense>
            {searchResults.map((model, index) => (
              <React.Fragment key={model.id}>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => handleLoadModel(model.id)}
                    disabled={isLoading}
                    sx={{ 
                      opacity: isLoading && selectedModel === model.id ? 0.6 : 1,
                      cursor: isLoading ? 'wait' : 'pointer'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {model.id}
                          </Typography>
                          {isLoading && selectedModel === model.id && (
                            <CircularProgress size={16} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          {model.downloads && (
                            <Chip
                              label={`${formatDownloads(model.downloads)} downloads`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {model.likes && (
                            <Chip
                              label={`${model.likes} likes`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {model.pipeline_tag && (
                            <Chip
                              label={model.pipeline_tag}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < searchResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading model configuration from Hugging Face Hub...
          </Typography>
        </Box>
      )}

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Select or click any model to automatically load its configuration from Hugging Face Hub.
      </Typography>
    </Box>
  );
};
