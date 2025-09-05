import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Box,
  Typography,
  Paper,
  ButtonGroup,
  Button,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,

} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as ClockIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { ComparisonResult, ModelSpecs, GPUSpecs } from '../types/calculator';
import { DEFAULT_SYSTEM_OVERHEAD } from '../types/calculator';
import { calculatePerformance } from '../utils/calculations';

interface ComparisonChartProps {
  availableModels: { name: string; specs: ModelSpecs }[];
  availableGPUs: GPUSpecs[];
}

type ChartType = 'performance' | 'bottleneck' | 'throughput';

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ availableModels, availableGPUs }) => {
  const [chartType, setChartType] = useState<ChartType>('performance');
  const [selectedModelIndex, setSelectedModelIndex] = useState<number>(0);
  const [selectedGPUs, setSelectedGPUs] = useState<string[]>([]);

  // Set default selected GPUs when availableGPUs loads
  useEffect(() => {
    if (availableGPUs.length > 0 && selectedGPUs.length === 0) {
      // Default to first 8 GPUs (or all if less than 8)
      const defaultCount = Math.min(8, availableGPUs.length);
      setSelectedGPUs(availableGPUs.slice(0, defaultCount).map(gpu => gpu.name));
    }
  }, [availableGPUs, selectedGPUs.length]);

  // Calculate comparisons based on selected model and filtered GPUs
  const currentModel = availableModels[selectedModelIndex]?.specs;
  const filteredGPUs = availableGPUs.filter(gpu => selectedGPUs.includes(gpu.name));
  const comparisons: ComparisonResult[] = currentModel ? filteredGPUs.map(gpu => ({
    gpu,
    results: calculatePerformance(gpu, currentModel, DEFAULT_SYSTEM_OVERHEAD),
  })) : [];

  const handleGPUToggle = (gpuName: string) => {
    setSelectedGPUs(prev => 
      prev.includes(gpuName) 
        ? prev.filter(name => name !== gpuName)
        : [...prev, gpuName]
    );
  };

  const handleSelectAll = () => {
    setSelectedGPUs(availableGPUs.map(gpu => gpu.name));
  };

  const handleDeselectAll = () => {
    setSelectedGPUs([]);
  };

  // Sort comparisons by performance (throughput) in descending order
  const sortedComparisons = [...comparisons].sort((a, b) => 
    b.results.throughputTokensPerSecond - a.results.throughputTokensPerSecond
  );

  // Prepare data for performance chart (times)
  const performanceData = sortedComparisons.map(comp => ({
    name: comp.gpu.name.replace('NVIDIA ', '').replace(' SXM', ''),
    prefillTime: comp.results.prefillTime,
    timePerToken: comp.results.timePerToken,
    totalTime: comp.results.totalGenerationTime,
    throughput: comp.results.throughputTokensPerSecond,
  }));

  // Prepare data for bottleneck analysis
  const bottleneckData = sortedComparisons.map(comp => ({
    name: comp.gpu.name.replace('NVIDIA ', '').replace(' SXM', ''),
    opsToByteRatio: comp.results.opsToByteRatio,
    arithmeticIntensity: comp.results.arithmeticIntensity,
    isMemoryBound: comp.results.isMemoryBound,
  }));

  // Prepare data for throughput comparison
  const throughputData = sortedComparisons.map(comp => ({
    name: comp.gpu.name.replace('NVIDIA ', '').replace(' SXM', ''),
    throughput: comp.results.throughputTokensPerSecond,
    computeBandwidth: comp.gpu.computeBandwidth,
    memoryBandwidth: comp.gpu.memoryBandwidth,
  }));

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes('Time') || name.includes('time')) {
      return value < 1000 ? `${value.toFixed(1)}ms` : `${(value / 1000).toFixed(2)}s`;
    }
    if (name.includes('throughput') || name.includes('Throughput')) {
      return `${value.toFixed(0)} tokens/s`;
    }
    if (name.includes('Bandwidth') || name.includes('bandwidth')) {
      return name.includes('compute') ? `${value} TFLOPS` : `${value} GB/s`;
    }
    return `${value.toFixed(1)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${formatTooltipValue(entry.value, entry.name)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={11}
              />
              <YAxis 
                label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }}
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend fontSize={11} />
              <Bar dataKey="prefillTime" fill="#3B82F6" name="Prefill" />
              <Bar dataKey="timePerToken" fill="#10B981" name="Decode" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'bottleneck':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bottleneckData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={11}
              />
              <YAxis 
                label={{ value: 'Ops/Byte', angle: -90, position: 'insideLeft' }}
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend fontSize={11} />
              <Line 
                type="monotone" 
                dataKey="opsToByteRatio" 
                stroke="#8B5CF6" 
                name="Ops:Byte Ratio"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="arithmeticIntensity" 
                stroke="#F59E0B" 
                name="Arithmetic Intensity"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'throughput':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={throughputData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={11}
              />
              <YAxis 
                label={{ value: 'Tokens/Second', angle: -90, position: 'insideLeft' }}
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend fontSize={11} />
              <Bar dataKey="throughput" fill="#EF4444" name="Throughput" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Filters Section */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Comparison Filters
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Model and GPU Summary Row */}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Model Selection */}
            <Box sx={{ flex: '0 0 300px' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="model-select-label">Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  value={selectedModelIndex}
                  label="Model"
                  onChange={(e) => setSelectedModelIndex(e.target.value as number)}
                >
                  {availableModels.map((model, index) => (
                    <MenuItem key={index} value={index}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* GPU Selection Summary */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                  Selected GPUs ({selectedGPUs.length} of {availableGPUs.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 60, overflow: 'auto' }}>
                  {selectedGPUs.slice(0, 6).map(gpuName => (
                    <Chip
                      key={gpuName}
                      label={gpuName.replace('NVIDIA ', '')}
                      size="small"
                      onDelete={() => handleGPUToggle(gpuName)}
                    />
                  ))}
                  {selectedGPUs.length > 6 && (
                    <Chip
                      label={`+${selectedGPUs.length - 6} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* GPU Selection Checkboxes */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                Available GPUs:
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button onClick={handleSelectAll} sx={{ fontSize: '0.7rem', py: 0.5 }}>
                  Select All
                </Button>
                <Button onClick={handleDeselectAll} sx={{ fontSize: '0.7rem', py: 0.5 }}>
                  Deselect All
                </Button>
              </ButtonGroup>
            </Box>
            <FormGroup sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 1
              }}>
                {availableGPUs.map((gpu) => (
                  <FormControlLabel
                    key={gpu.name}
                    control={
                      <Checkbox
                        checked={selectedGPUs.includes(gpu.name)}
                        onChange={() => handleGPUToggle(gpu.name)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="caption">
                        {gpu.name.replace('NVIDIA ', '')}
                      </Typography>
                    }
                  />
                ))}
              </Box>
            </FormGroup>
          </Box>
        </Box>
      </Paper>

      {/* Chart Type Selector */}
      <ButtonGroup variant="outlined" sx={{ alignSelf: 'center', flexWrap: 'wrap' }}>
        <Button
          onClick={() => setChartType('performance')}
          variant={chartType === 'performance' ? 'contained' : 'outlined'}
          startIcon={<ClockIcon />}
          sx={{ minWidth: 120 }}
        >
          Performance
        </Button>
        
        <Button
          onClick={() => setChartType('bottleneck')}
          variant={chartType === 'bottleneck' ? 'contained' : 'outlined'}
          startIcon={<BarChartIcon />}
          sx={{ minWidth: 120 }}
        >
          Bottleneck
        </Button>
        
        <Button
          onClick={() => setChartType('throughput')}
          variant={chartType === 'throughput' ? 'contained' : 'outlined'}
          startIcon={<TrendingUpIcon />}
          sx={{ minWidth: 120 }}
        >
          Throughput
        </Button>
      </ButtonGroup>

      {/* Chart */}
      <Paper elevation={2} sx={{ p: 3 }}>
        {renderChart()}
      </Paper>

      {/* Chart Description */}
      <Alert severity="info" icon={<InfoIcon />}>
        {chartType === 'performance' && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Performance Times:
            </Typography>
            <Typography variant="body2">
              Compare prefill and generation times. Lower is better.
            </Typography>
          </>
        )}
        {chartType === 'bottleneck' && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Bottleneck Analysis:
            </Typography>
            <Typography variant="body2">
              When intensity below ratio line, it's memory-bound. Above = compute-bound.
            </Typography>
          </>
        )}
        {chartType === 'throughput' && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Throughput:
            </Typography>
            <Typography variant="body2">
              Total tokens/second including input and output. Higher is better.
            </Typography>
          </>
        )}
      </Alert>

      {/* GPU Ranking */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'success.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 16 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Fastest (Throughput)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {comparisons
              .sort((a, b) => b.results.throughputTokensPerSecond - a.results.throughputTokensPerSecond)
              .slice(0, 3)
              .map((comp, index) => (
                <Box key={comp.gpu.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">
                    {index + 1}. {comp.gpu.name.replace('NVIDIA ', '')}
                  </Typography>
                  <Chip 
                    label={comp.results.throughputTokensPerSecond.toFixed(0)}
                    size="small"
                    sx={{ 
                      fontFamily: 'monospace',
                      backgroundColor: 'success.main',
                      color: 'success.contrastText',
                      height: 20,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
              ))}
          </Box>
        </Paper>

        <Paper sx={{ p: 2, backgroundColor: 'warning.light', color: 'warning.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ClockIcon sx={{ fontSize: 16 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Lowest Latency
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {comparisons
              .sort((a, b) => a.results.timePerToken - b.results.timePerToken)
              .slice(0, 3)
              .map((comp, index) => (
                <Box key={comp.gpu.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">
                    {index + 1}. {comp.gpu.name.replace('NVIDIA ', '')}
                  </Typography>
                  <Chip 
                    label={comp.results.timePerToken < 1000 
                      ? `${comp.results.timePerToken.toFixed(1)}ms`
                      : `${(comp.results.timePerToken / 1000).toFixed(2)}s`
                    }
                    size="small"
                    sx={{ 
                      fontFamily: 'monospace',
                      backgroundColor: 'warning.main',
                      color: 'warning.contrastText',
                      height: 20,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
              ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
