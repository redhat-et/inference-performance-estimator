import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Paper,
  Tooltip,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import type { ModelSpecs, QuantizationType, ModelPreset } from '../types/calculator';
import { QUANTIZATION_OPTIONS } from '../types/calculator';
import { HuggingFaceModelSearch } from './HuggingFaceModelSearch';

interface ModelInputsProps {
  modelSpecs: ModelSpecs;
  onModelChange: (specs: ModelSpecs) => void;
}


export const ModelInputs: React.FC<ModelInputsProps> = ({ modelSpecs, onModelChange }) => {
  const [currentModelPreset, setCurrentModelPreset] = useState<ModelPreset | null>(null);
  const [hubError, setHubError] = useState<string>('');

  const handleInputChange = (field: keyof ModelSpecs, value: number | QuantizationType) => {
    onModelChange({ ...modelSpecs, [field]: value });
  };

  const handleHuggingFaceModelLoad = (model: ModelPreset) => {
    setCurrentModelPreset(model);
    onModelChange({ 
      ...modelSpecs, 
      parameters: model.parameters,
      sequenceLength: model.sequenceLength,
      headDimension: model.headDimension,
      nLayers: model.nLayers,
      nHeads: model.nHeads,
      quantization: model.defaultQuantization
    });
    setHubError('');
  };

  const handleHuggingFaceError = (error: string) => {
    setHubError(error);
  };

  // Calculate model size based on quantization
  const quantInfo = QUANTIZATION_OPTIONS.find(q => q.name === modelSpecs.quantization) || QUANTIZATION_OPTIONS[1];
  const modelSizeGB = modelSpecs.parameters * quantInfo.bytesPerParameter;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Hugging Face Hub Model Selection */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <HuggingFaceModelSearch
          onModelLoad={handleHuggingFaceModelLoad}
          onError={handleHuggingFaceError}
        />
      </Paper>

      {/* Display current model info */}
      {currentModelPreset && (
        <Alert 
          severity="info" 
          sx={{ 
            '& .MuiAlert-message': { 
              display: 'flex', 
              flexDirection: 'column',
              gap: 0.5
            }
          }}
        >
          <Typography variant="subtitle2">
            Current Model: {currentModelPreset.name}
          </Typography>
          {currentModelPreset.isFromHub && (
            <Typography variant="caption">
              Loaded from Hugging Face Hub • {' '}
              <a 
                href={currentModelPreset.hubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'inherit' }}
              >
                View on Hub →
              </a>
            </Typography>
          )}
        </Alert>
      )}

      {/* Hub Error Display */}
      {hubError && (
        <Alert severity="error" onClose={() => setHubError('')}>
          {hubError}
        </Alert>
      )}

      {/* Parameters Input */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Parameters (Billions)"
          type="number"
          value={modelSpecs.parameters}
          onChange={(e) => handleInputChange('parameters', parseFloat(e.target.value) || 0)}
          size="small"
          fullWidth
          placeholder="7"
          inputProps={{ min: 0.1, step: 0.1 }}
        />
        <Tooltip title="Total parameters (e.g., 7 for Llama 2 7B)" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quantization */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="quantization-label">Quantization</InputLabel>
          <Select
            labelId="quantization-label"
            value={modelSpecs.quantization}
            label="Quantization"
            onChange={(e) => handleInputChange('quantization', e.target.value as QuantizationType)}
          >
            {QUANTIZATION_OPTIONS.map((quant) => (
              <MenuItem key={quant.name} value={quant.name}>
                {quant.name} ({quant.bytesPerParameter}x bytes/param)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title={quantInfo.description} placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

                {/* Context Length */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Context Length (N)"
              type="number"
              value={modelSpecs.sequenceLength}
              onChange={(e) => handleInputChange('sequenceLength', parseInt(e.target.value) || 0)}
              size="small"
              fullWidth
              placeholder="4096"
              inputProps={{ min: 1, step: 1 }}
            />
            <Tooltip title="N - context window size used in attention equation (4096 for Llama 2 7B)" placement="top">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Head Dimension */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Attention Head Dimension (d)"
              type="number"
              value={modelSpecs.headDimension || 128}
              onChange={(e) => handleInputChange('headDimension', parseInt(e.target.value) || 128)}
              size="small"
              fullWidth
              placeholder="128"
              inputProps={{ min: 1, step: 1 }}
            />
            <Tooltip title="d - dimension of a single attention head (128 for Llama 2 7B)" placement="top">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Number of Layers */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Number of Layers"
              type="number"
              value={modelSpecs.nLayers || 32}
              onChange={(e) => handleInputChange('nLayers', parseInt(e.target.value) || 32)}
              size="small"
              fullWidth
              placeholder="32"
              inputProps={{ min: 1, step: 1 }}
            />
            <Tooltip title="Number of transformer layers (32 for Llama 2 7B)" placement="top">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Number of Heads */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Number of Heads (n_heads)"
              type="number"
              value={modelSpecs.nHeads || 32}
              onChange={(e) => handleInputChange('nHeads', parseInt(e.target.value) || 32)}
              size="small"
              fullWidth
              placeholder="32"
              inputProps={{ min: 1, step: 1 }}
            />
            <Tooltip title="Number of attention heads (32 for Llama 2 7B, d_model = d_head * n_heads)" placement="top">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

      {/* Separator */}
      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
          Inference Parameters
        </Typography>
      </Divider>

      {/* Batch Size */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Batch Size"
          type="number"
          value={modelSpecs.batchSize}
          onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value) || 1)}
          size="small"
          fullWidth
          placeholder="1"
          inputProps={{ min: 1, step: 1 }}
        />
        <Tooltip title="Sequences processed simultaneously" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Prompt Tokens */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Prompt Tokens"
          type="number"
          value={modelSpecs.promptTokens}
          onChange={(e) => handleInputChange('promptTokens', parseInt(e.target.value) || 0)}
          size="small"
          fullWidth
          placeholder="350"
          inputProps={{ min: 1, step: 1 }}
        />
        <Tooltip title="Input tokens (prefill)" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Output Tokens */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Output Tokens"
          type="number"
          value={modelSpecs.outputTokens}
          onChange={(e) => handleInputChange('outputTokens', parseInt(e.target.value) || 0)}
          size="small"
          fullWidth
          placeholder="150"
          inputProps={{ min: 1, step: 1 }}
        />
        <Tooltip title="Tokens to generate" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary */}
      <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'success.contrastText' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Summary
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption">
            Total tokens: {modelSpecs.promptTokens + modelSpecs.outputTokens}
          </Typography>
          <Typography variant="caption">
            Model size: ~{modelSizeGB.toFixed(1)} GB ({modelSpecs.quantization})
          </Typography>
          <Typography variant="caption">
            Batch size: {modelSpecs.batchSize}
          </Typography>
          <Typography variant="caption">
            Attention dimensions: N={modelSpecs.sequenceLength}, d={modelSpecs.headDimension || 128}
          </Typography>
          <Typography variant="caption">
            Architecture: {modelSpecs.nLayers || 32} layers, {modelSpecs.nHeads || 32} heads, d_model={(modelSpecs.headDimension || 128) * (modelSpecs.nHeads || 32)}
          </Typography>
          <Typography variant="caption">
            Quantization: {modelSpecs.quantization} ({quantInfo.bytesPerParameter}x bytes/param)
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
