import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Alert,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  Bolt as BoltIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { GPUSpecs, CalculationResults } from '../types/calculator';

interface ResultsDisplayProps {
  gpu: GPUSpecs;
  results: CalculationResults;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ gpu, results }) => {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (num: number, decimals: number = 1): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toFixed(decimals);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Memory Check Warning */}
      {results.hasMemoryWarning && (
        <Alert 
          severity={results.memoryUtilization > 100 ? 'error' : 'warning'} 
          icon={results.memoryUtilization > 100 ? <ErrorIcon /> : <WarningIcon />}
          sx={{ p: 2 }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            {results.memoryUtilization > 100 ? 'Memory Overflow!' : 'Memory Warning'}
          </Typography>
          <Typography variant="body2">
            {results.memoryWarningMessage}
          </Typography>
        </Alert>
      )}

      {/* Performance Warning */}
      {results.hasPerformanceWarning && (
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ p: 2 }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Poor Performance Warning
          </Typography>
          <Typography variant="body2">
            {results.performanceWarningMessage}
          </Typography>
        </Alert>
      )}

      {/* Memory Usage Display */}
      <Paper sx={{ p: 2, backgroundColor: results.hasMemoryWarning ? 'error.light' : 'info.light', color: results.hasMemoryWarning ? 'error.contrastText' : 'info.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MemoryIcon sx={{ fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Total Memory Usage
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {results.totalMemoryUsedGB.toFixed(1)} GB
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {results.memoryUtilization.toFixed(1)}%
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Model + KV cache + overhead / {gpu.memorySize} GB total GPU memory
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, opacity: 0.8 }}>
          <Typography variant="caption">Model: {results.modelSizeGB.toFixed(1)} GB</Typography>
          <Typography variant="caption">KV Cache: {(results.currentKVCacheGB * 1000).toFixed(0)} MB</Typography>
        </Box>
      </Paper>

      {/* KV Cache Analysis */}
      <Paper sx={{ p: 2, backgroundColor: 'warning.light', color: 'warning.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MemoryIcon sx={{ fontSize: 18 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            KV Cache Analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Per Token
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {(results.kvCachePerTokenGB * 1000).toFixed(2)} MB
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Free Memory
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {results.freeMemoryForKVCacheGB.toFixed(1)} GB
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Max Tokens
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {formatNumber(results.maxKVCacheTokens, 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Max Batch Size
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {results.maxBatchSize}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Bottleneck Analysis */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Paper sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SpeedIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Ops:Byte Ratio
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {formatNumber(results.opsToByteRatio)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Hardware capability
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, backgroundColor: 'secondary.light', color: 'secondary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BoltIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Arithmetic Intensity
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {formatNumber(results.arithmeticIntensity)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Model requirement
          </Typography>
        </Paper>
      </Box>

            {/* Bottleneck Result */}
      <Alert 
        severity={results.isMemoryBound ? 'warning' : 'success'} 
        icon={results.isMemoryBound ? <WarningIcon /> : <CheckCircleIcon />}
        sx={{ p: 2 }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          {results.isMemoryBound ? 'Memory Bound' : 'Compute Bound'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          Arithmetic intensity ({results.arithmeticIntensity.toFixed(1)}) vs Ops:Byte ratio ({results.opsToByteRatio.toFixed(1)})
        </Typography>
        
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {results.isMemoryBound ? (
            <>Tip: Increase batch size or use higher memory bandwidth GPU</>
          ) : (
            <>Tip: Upgrade compute power or use optimization techniques</>
          )}
        </Typography>
      </Alert>

      {/* Divider */}
      <Divider sx={{ my: 2 }} />

      {/* Performance Estimation Notice */}
      <Alert severity="info" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Performance Estimation Notice
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              These performance numbers below are <strong>theoretical estimates</strong> based on the following assumptions:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5 } }}>
              <li>
                <Typography variant="caption">
                  <strong>Prefill phase</strong> is compute-bound (limited by GPU compute bandwidth)
                </Typography>
              </li>
              <li>
                <Typography variant="caption">
                  <strong>Decode phase</strong> is memory-bound (limited by memory bandwidth)
                </Typography>
              </li>
              <li>
                <Typography variant="caption">
                  <strong>Single batch inference</strong> with no additional optimizations
                </Typography>
              </li>
            </Box>
            <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
              Real-world performance may vary significantly based on model implementation, 
              hardware specifics, software optimizations, and workload characteristics.
            </Typography>
          </Box>
        </Box>
      </Alert>

      {/* Performance Metrics */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
        gap: 2 
      }}>
        <Card elevation={2}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                Prefill
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {formatTime(results.prefillTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              total
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BoltIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                Decode
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {formatTime(results.timePerToken)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              per token
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                Total Time
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {formatTime(results.totalGenerationTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              end-to-end
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                Throughput
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {formatNumber(results.throughputTokensPerSecond, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              token/s
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
