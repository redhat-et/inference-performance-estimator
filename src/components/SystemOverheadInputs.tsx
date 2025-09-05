import React from 'react';
import {
  TextField,
  Box,
  Typography,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import type { SystemOverhead } from '../types/calculator';

interface SystemOverheadInputsProps {
  systemOverhead: SystemOverhead;
  onSystemOverheadChange: (overhead: SystemOverhead) => void;
}

export const SystemOverheadInputs: React.FC<SystemOverheadInputsProps> = ({
  systemOverhead,
  onSystemOverheadChange
}) => {
  const handleInputChange = (field: keyof SystemOverhead, value: number) => {
    onSystemOverheadChange({ ...systemOverhead, [field]: value });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Prefill Efficiency */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Prefill Efficiency (%)"
          type="number"
          value={systemOverhead.prefillEfficiencyPercent}
          onChange={(e) => handleInputChange('prefillEfficiencyPercent', parseFloat(e.target.value) || 100)}
          size="small"
          fullWidth
          placeholder="100"
          inputProps={{ min: 1, max: 200, step: 1 }}
        />
        <Tooltip title="Efficiency of prefill operations as percentage (100% = theoretical baseline, <100% = slower due to overhead, >100% = faster due to optimizations)" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Decode Efficiency */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Decode Efficiency (%)"
          type="number"
          value={systemOverhead.decodeEfficiencyPercent}
          onChange={(e) => handleInputChange('decodeEfficiencyPercent', parseFloat(e.target.value) || 100)}
          size="small"
          fullWidth
          placeholder="100"
          inputProps={{ min: 1, max: 200, step: 1 }}
        />
        <Tooltip title="Efficiency of decode/time-per-token operations as percentage (100% = theoretical baseline, <100% = slower due to overhead, >100% = faster due to optimizations)" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary */}
      <Paper sx={{ p: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          System Overhead Summary
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption">
            Prefill efficiency: {systemOverhead.prefillEfficiencyPercent}%
          </Typography>
          <Typography variant="caption">
            Decode efficiency: {systemOverhead.decodeEfficiencyPercent}%
          </Typography>
          <Typography variant="caption">
            {systemOverhead.prefillEfficiencyPercent === 100 && systemOverhead.decodeEfficiencyPercent === 100 
              ? 'Using theoretical performance (100% efficiency)'
              : `Performance impact: ${
                  systemOverhead.prefillEfficiencyPercent < 100 || systemOverhead.decodeEfficiencyPercent < 100
                    ? `${Math.min(systemOverhead.prefillEfficiencyPercent, systemOverhead.decodeEfficiencyPercent)}% efficiency (slower)`
                    : `${Math.min(systemOverhead.prefillEfficiencyPercent, systemOverhead.decodeEfficiencyPercent)}% efficiency (optimized)`
                }`
            }
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
