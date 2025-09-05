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
} from '@mui/material';
import type { GPUSpecs } from '../types/calculator';

interface GPUSelectorProps {
  selectedGPU: GPUSpecs | null;
  onGPUChange: (gpu: GPUSpecs) => void;
  availableGPUs: GPUSpecs[];
}

export const GPUSelector: React.FC<GPUSelectorProps> = ({ selectedGPU, onGPUChange, availableGPUs }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customGPU, setCustomGPU] = useState<GPUSpecs>(selectedGPU || {
    name: 'Custom GPU',
    computeBandwidth: 100,
    memoryBandwidth: 500,
    memorySize: 16,
  });

  const handlePresetChange = (gpuName: string) => {
    if (gpuName === 'custom') {
      setIsCustom(true);
      onGPUChange(customGPU);
    } else {
      setIsCustom(false);
      const gpu = availableGPUs.find(g => g.name === gpuName);
      if (gpu) {
        onGPUChange(gpu);
      }
    }
  };

  const handleCustomGPUChange = (field: keyof GPUSpecs, value: string | number) => {
    const updatedGPU = { ...customGPU, [field]: value };
    setCustomGPU(updatedGPU);
    onGPUChange(updatedGPU);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* GPU Preset Selector */}
      <FormControl fullWidth size="small">
        <InputLabel id="gpu-select-label">Select GPU</InputLabel>
        <Select
          labelId="gpu-select-label"
          value={isCustom ? 'custom' : (selectedGPU?.name || '')}
          label="Select GPU"
          onChange={(e) => handlePresetChange(e.target.value as string)}
        >
          {availableGPUs.map((gpu) => (
            <MenuItem key={gpu.name} value={gpu.name}>
              {gpu.name}
            </MenuItem>
          ))}
          <MenuItem value="custom">Custom GPU</MenuItem>
        </Select>
      </FormControl>

      {/* Custom GPU Inputs */}
      {isCustom && (
        <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="GPU Name"
              value={customGPU.name}
              onChange={(e) => handleCustomGPUChange('name', e.target.value)}
              size="small"
              fullWidth
              placeholder="Custom GPU"
            />

            <TextField
              label="Compute Bandwidth (TFLOPS)"
              type="number"
              value={customGPU.computeBandwidth}
              onChange={(e) => handleCustomGPUChange('computeBandwidth', parseFloat(e.target.value) || 0)}
              size="small"
              fullWidth
              placeholder="125"
              inputProps={{ min: 0, step: 0.1 }}
            />

            <TextField
              label="Memory Bandwidth (GB/s)"
              type="number"
              value={customGPU.memoryBandwidth}
              onChange={(e) => handleCustomGPUChange('memoryBandwidth', parseFloat(e.target.value) || 0)}
              size="small"
              fullWidth
              placeholder="600"
              inputProps={{ min: 0, step: 0.1 }}
            />

            <TextField
              label="Memory Size (GB)"
              type="number"
              value={customGPU.memorySize}
              onChange={(e) => handleCustomGPUChange('memorySize', parseFloat(e.target.value) || 0)}
              size="small"
              fullWidth
              placeholder="24"
              inputProps={{ min: 0, step: 1 }}
            />
          </Box>
        </Paper>
      )}

      {/* GPU Specs Display */}
      {selectedGPU && (
        <Paper sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Current GPU Specs
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">Compute:</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {selectedGPU.computeBandwidth} TFLOPS
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">Memory BW:</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {selectedGPU.memoryBandwidth} GB/s
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">Memory:</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {selectedGPU.memorySize} GB
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
