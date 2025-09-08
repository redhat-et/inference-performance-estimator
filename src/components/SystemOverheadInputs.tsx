import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  IconButton,
  Slider,
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
      {/* System Efficiency */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: '140px' }}>
            System Efficiency
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', minWidth: '45px' }}>
            {systemOverhead.systemEfficiencyPercent}%
          </Typography>
          <Tooltip title="Overall system efficiency as percentage (100% = theoretical baseline, <100% = slower due to overhead, >100% = faster due to optimizations)" placement="top">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Slider
          value={systemOverhead.systemEfficiencyPercent}
          onChange={(_, value) => handleInputChange('systemEfficiencyPercent', Array.isArray(value) ? value[0] : value)}
          min={0}
          max={120}
          step={5}
          marks={[
            { value: 0, label: '0%' },
            { value: 25, label: '25%' },
            { value: 50, label: '50%' },
            { value: 75, label: '75%' },
            { value: 100, label: '100%' },
            { value: 120, label: '120%' }
          ]}
          sx={{ mx: 1 }}
        />
      </Box>

      {/* Summary */}
      <Paper sx={{ p: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          System Efficiency Summary
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption">
            Overall system efficiency: {systemOverhead.systemEfficiencyPercent}%
          </Typography>
          <Typography variant="caption">
            {systemOverhead.systemEfficiencyPercent === 100 
              ? 'Using theoretical performance (100% efficiency)'
              : systemOverhead.systemEfficiencyPercent < 100
                ? `Performance impact: ${systemOverhead.systemEfficiencyPercent}% efficiency (slower due to overhead)`
                : `Performance impact: ${systemOverhead.systemEfficiencyPercent}% efficiency (optimized)`
            }
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
