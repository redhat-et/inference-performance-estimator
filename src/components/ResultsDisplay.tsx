import React from 'react';
import {
  Box,
  Typography,
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

      {/* GPU Memory Requirements Breakdown */}
      <Paper sx={{ p: 3, backgroundColor: results.hasMemoryWarning ? 'error.light' : 'success.light', color: results.hasMemoryWarning ? 'error.contrastText' : 'success.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MemoryIcon sx={{ fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            GPU Memory Requirements
          </Typography>
        </Box>
        
        {/* Individual Components */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              1. Model Weight Memory
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {results.modelSizeGB.toFixed(2)} GB
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              2. System Overhead Memory
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {results.systemOverheadGB.toFixed(2)} GB
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              3. PyTorch Activation Memory
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {results.activationMemoryGB.toFixed(2)} GB
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              4. KV Cache Memory
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {results.currentKVCacheGB.toFixed(2)} GB
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5, opacity: 0.5 }} />
        
        {/* Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            ✅ Required GPU Memory:
          </Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {results.totalMemoryUsedGB.toFixed(2)} GB
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {results.memoryUtilization.toFixed(1)}% of {gpu.memorySize} GB
            </Typography>
          </Box>
        </Box>
        
        {/* Additional KV Cache Info */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', opacity: 0.8 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            KV Cache Details: {(results.kvCachePerTokenGB * 1000).toFixed(2)} MB per token • 
            Free memory: {results.freeMemoryForKVCacheGB.toFixed(1)} GB • 
            Max batch size: {results.maxBatchSize}
          </Typography>
        </Box>
      </Paper>

      {/* Bottleneck Analysis */}
      <Alert 
        severity={results.isMemoryBound ? 'warning' : 'success'} 
        icon={results.isMemoryBound ? <WarningIcon /> : <CheckCircleIcon />}
        sx={{ p: 2 }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Performance Bottleneck: {results.isMemoryBound ? 'Memory Bound' : 'Compute Bound'}
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Hardware Capability</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Ops:Byte Ratio: {formatNumber(results.opsToByteRatio)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Model Requirement</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Arithmetic Intensity: {formatNumber(results.arithmeticIntensity)}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {results.isMemoryBound ? (
            <>💡 Tip: Increase batch size or use higher memory bandwidth GPU</>
          ) : (
            <>💡 Tip: Upgrade compute power or use optimization techniques</>
          )}
        </Typography>
      </Alert>

      {/* Performance Metrics */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Performance Estimates
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
          gap: 2,
          mb: 2
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <ClockIcon sx={{ fontSize: 16, color: 'text.secondary', mb: 0.5 }} />
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              Time to First Token
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {formatTime(results.prefillTime)}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <BoltIcon sx={{ fontSize: 16, color: 'text.secondary', mb: 0.5 }} />
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              Inter Token Latency
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {formatTime(results.timePerToken)}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <ClockIcon sx={{ fontSize: 16, color: 'text.secondary', mb: 0.5 }} />
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              Total Time
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {formatTime(results.totalGenerationTime)}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary', mb: 0.5 }} />
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              Throughput
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {formatNumber(results.throughputTokensPerSecond, 0)} tok/s
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            <strong>Note:</strong> These are theoretical estimates assuming time-to-first-token is compute-bound, 
            inter-token-latency is memory-bound, and single batch inference. 
            Real performance may vary based on implementation and optimizations.
          </Typography>
        </Alert>
      </Paper>

    </Box>
  );
};
