import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  Chip,
} from '@mui/material';
import { 
  TableChart as TableChartIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import type { GPUSpecs, ModelSpecs, QuantizationType } from '../types/calculator';
import { DEFAULT_SYSTEM_OVERHEAD, DEFAULT_INFERENCE_PARAMS } from '../types/calculator';
import { calculatePrefillTime, calculateTimePerToken } from '../utils/calculations';

// Model configurations with realistic architecture specs
interface ModelConfig {
  name: string;
  shortName: string;
  specs: ModelSpecs;
  alpacaEvalScore: number; // AlpacaEval-2.0 benchmark score
}

const MODELS: ModelConfig[] = [
  {
    name: 'Granite 3.3 2B',
    shortName: 'granite-3.3-2b',
    alpacaEvalScore: 43.45, // From IBM Granite 3.3-2B-Instruct benchmarks
    specs: {
      parameters: 2.0,
      sequenceLength: 131072, // 128K context length as per IBM docs
      batchSize: DEFAULT_INFERENCE_PARAMS.batchSize,
      promptTokens: DEFAULT_INFERENCE_PARAMS.promptTokens,
      outputTokens: DEFAULT_INFERENCE_PARAMS.outputTokens,
      quantization: 'FP16' as QuantizationType, // Corrected from INT4
      headDimension: 64,
      nLayers: 26,
      nHeads: 32,
      nKvHeads: 32,
      hiddenSize: 2048,
      intermediateSize: 5632,
    },
  },
  {
    name: 'Granite 3.3 8B', 
    shortName: 'granite-3.3-8b',
    alpacaEvalScore: 62.68, // From IBM Granite 3.3-8B-Instruct benchmarks
    specs: {
      parameters: 8.0,
      sequenceLength: 131072, // 128K context length as per IBM docs
      batchSize: DEFAULT_INFERENCE_PARAMS.batchSize,
      promptTokens: DEFAULT_INFERENCE_PARAMS.promptTokens,
      outputTokens: DEFAULT_INFERENCE_PARAMS.outputTokens,
      quantization: 'FP16' as QuantizationType, // Corrected from INT4
      headDimension: 128,
      nLayers: 32,
      nHeads: 32,
      nKvHeads: 32,
      hiddenSize: 4096,
      intermediateSize: 11008,
    },
  },
  {
    name: 'Gemma 3 1B',
    shortName: 'gemma-3-1b', 
    alpacaEvalScore: 35.2, // Estimated based on Gemma 3 performance
    specs: {
      parameters: 1.0,
      sequenceLength: 32768, // 32K context for 1B size
      batchSize: DEFAULT_INFERENCE_PARAMS.batchSize,
      promptTokens: DEFAULT_INFERENCE_PARAMS.promptTokens,
      outputTokens: DEFAULT_INFERENCE_PARAMS.outputTokens,
      quantization: 'FP16' as QuantizationType,
      headDimension: 64,
      nLayers: 18,
      nHeads: 16,
      nKvHeads: 16,
      hiddenSize: 1024,
      intermediateSize: 4096,
    },
  },
  {
    name: 'Gemma 3 4B',
    shortName: 'gemma-3-4b',
    alpacaEvalScore: 52.8, // Estimated based on Gemma 3 performance
    specs: {
      parameters: 4.0,
      sequenceLength: 131072, // 128K context for 4B+ sizes
      batchSize: DEFAULT_INFERENCE_PARAMS.batchSize,
      promptTokens: DEFAULT_INFERENCE_PARAMS.promptTokens,
      outputTokens: DEFAULT_INFERENCE_PARAMS.outputTokens,
      quantization: 'FP16' as QuantizationType,
      headDimension: 128,
      nLayers: 32,
      nHeads: 32,
      nKvHeads: 16,
      hiddenSize: 4096,
      intermediateSize: 14336,
    },
  },
  {
    name: 'Gemma 3 27B',
    shortName: 'gemma-3-27b',
    alpacaEvalScore: 68.5, // Estimated based on Gemma 3 performance
    specs: {
      parameters: 27.0,
      sequenceLength: 131072, // 128K context for 4B+ sizes
      batchSize: DEFAULT_INFERENCE_PARAMS.batchSize,
      promptTokens: DEFAULT_INFERENCE_PARAMS.promptTokens,
      outputTokens: DEFAULT_INFERENCE_PARAMS.outputTokens,
      quantization: 'FP16' as QuantizationType,
      headDimension: 256,
      nLayers: 46,
      nHeads: 32,
      nKvHeads: 16,
      hiddenSize: 8192,
      intermediateSize: 73728,
    },
  },
];

interface DeviceModelPerformance {
  deviceName: string;
  modelName: string;
  ttft: number; // Time to First Token in ms
  itl: number;  // Inter-Token Latency in ms
  canRun: boolean; // Whether the model can run on this device
}

interface FilterState {
  ttftRange: [number, number];
  itlRange: [number, number];
  budgetRange: [number, number];
  alpacaEvalRange: [number, number];
  contextLengthRange: [number, number];
  inputTokenCount: number;
}

interface DeviceModelMatrixProps {
  availableGPUs: GPUSpecs[];
}

// Performance estimation using actual calculation functions
const estimatePerformance = (gpu: GPUSpecs, model: ModelConfig, inputTokens: number = DEFAULT_INFERENCE_PARAMS.promptTokens): DeviceModelPerformance => {
  // Basic memory check first - simplified version to avoid complex architecture validation errors
  const modelSizeGB = model.specs.parameters * 2.0; // FP16 quantization ~2GB per billion params
  const canRun = modelSizeGB <= gpu.memorySize * 0.75; // Allow 75% memory usage for safety
  
  if (!canRun) {
    return {
      deviceName: gpu.name,
      modelName: model.name,
      ttft: -1,
      itl: -1,
      canRun: false,
    };
  }

  try {
    // Create modified model specs with custom input token count
    const modelSpecsWithCustomTokens = {
      ...model.specs,
      promptTokens: inputTokens
    };
    
    // Use the actual calculation functions from calculations.ts
    const ttft = calculatePrefillTime(gpu, modelSpecsWithCustomTokens, DEFAULT_SYSTEM_OVERHEAD);
    const itl = calculateTimePerToken(gpu, modelSpecsWithCustomTokens, DEFAULT_SYSTEM_OVERHEAD);

    return {
      deviceName: gpu.name,
      modelName: model.name,
      ttft,
      itl,
      canRun: true,
    };
  } catch (error) {
    // If calculation fails (e.g., missing architecture params), fall back to basic estimates
    console.warn(`Performance calculation failed for ${model.name} on ${gpu.name}:`, error);

    // Fallback to simplified estimates if detailed calculation fails
    const ttft = (model.specs.parameters * inputTokens * 2) / Math.max(gpu.computeBandwidth * 1000, 1);
    const itl = (model.specs.parameters * 2) / Math.max(gpu.memoryBandwidth, 1);

    return {
      deviceName: gpu.name,
      modelName: model.name,
      ttft: Math.max(50, ttft),
      itl: Math.max(10, itl),
      canRun: true,
    };
  }
};


export const DeviceModelMatrix: React.FC<DeviceModelMatrixProps> = ({ availableGPUs }) => {

  const [filters, setFilters] = useState<FilterState>({
    ttftRange: [0, 10000], // Default range (0ms to 10000ms)
    itlRange: [0, 1000],   // Default range (0ms to 1000ms) 
    budgetRange: [0, 5000], // Default budget range ($0 to $5000)
    alpacaEvalRange: [0, 100], // Default AlpacaEval range (0 to 100)
    contextLengthRange: [0, 200000], // Default context length range (0 to 200K tokens)
    inputTokenCount: 512, // Default input token count (512 tokens)
  });

  // Calculate data ranges for slider bounds (TTFT depends on current input token count)
  const dataRanges = useMemo(() => {
    const ttftValues: number[] = [];
    const itlValues: number[] = [];
    const budgetValues: number[] = [];
    const alpacaEvalValues: number[] = [];
    const contextLengthValues: number[] = [];

    // Collect all performance values from devices with prices only
    // Use current input token count for dynamic TTFT calculation
    const currentInputTokens = filters.inputTokenCount || 512;
    
    availableGPUs
      .filter(gpu => gpu.price !== undefined)
      .forEach(gpu => {
        MODELS.forEach(model => {
          try {
            const performance = estimatePerformance(gpu, model, currentInputTokens);
            if (performance.canRun) {
              ttftValues.push(performance.ttft);
              itlValues.push(performance.itl);
            }
            // Collect model-specific values regardless of device compatibility
            alpacaEvalValues.push(model.alpacaEvalScore);
            contextLengthValues.push(model.specs.sequenceLength);
          } catch (error) {
            // Skip failed calculations but still collect model data
            alpacaEvalValues.push(model.alpacaEvalScore);
            contextLengthValues.push(model.specs.sequenceLength);
          }
        });
        
        budgetValues.push(gpu.price!); // Safe to use ! since we filtered for defined prices
      });

    // Remove duplicates from model-specific values
    const uniqueAlpacaEvalValues = [...new Set(alpacaEvalValues)];
    const uniqueContextLengthValues = [...new Set(contextLengthValues)];

    return {
      ttft: ttftValues.length > 0 ? {
        min: Math.max(0, Math.floor(Math.min(...ttftValues) * 0.9)),
        max: Math.ceil(Math.max(...ttftValues) * 1.1)
      } : { min: 0, max: 10000 },
      itl: itlValues.length > 0 ? {
        min: Math.max(0, Math.floor(Math.min(...itlValues) * 0.9)),
        max: Math.ceil(Math.max(...itlValues) * 1.1)
      } : { min: 0, max: 1000 },
      budget: budgetValues.length > 0 ? {
        min: Math.max(0, Math.floor(Math.min(...budgetValues) * 0.9 / 100) * 100), // Round to nearest $100
        max: Math.ceil(Math.max(...budgetValues) * 1.1 / 100) * 100
      } : { min: 0, max: 5000 },
      alpacaEval: uniqueAlpacaEvalValues.length > 0 ? {
        min: Math.floor(Math.min(...uniqueAlpacaEvalValues) * 0.9),
        max: Math.ceil(Math.max(...uniqueAlpacaEvalValues) * 1.1)
      } : { min: 0, max: 100 },
      contextLength: uniqueContextLengthValues.length > 0 ? {
        min: Math.min(...uniqueContextLengthValues),
        max: Math.max(...uniqueContextLengthValues)
      } : { min: 0, max: 200000 },
      inputToken: {
        min: 1, // Minimum 1 input token
        max: 8192, // Maximum 8K input tokens (reasonable for most prompts)
        default: 512 // Default 512 tokens (reasonable prompt size)
      }
    };
  }, [availableGPUs, filters.inputTokenCount]);

  // Update filter ranges when data ranges change
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      // Only update TTFT range dynamically when input tokens change, preserve other user settings
      ttftRange: [dataRanges.ttft.min, dataRanges.ttft.max],
      // Initialize other ranges only if they're at defaults
      ...(prev.itlRange[0] === 0 && prev.itlRange[1] === 1000 ? { itlRange: [dataRanges.itl.min, dataRanges.itl.max] } : {}),
      ...(prev.budgetRange[0] === 0 && prev.budgetRange[1] === 5000 ? { budgetRange: [dataRanges.budget.min, dataRanges.budget.max] } : {}),
      ...(prev.alpacaEvalRange[0] === 0 && prev.alpacaEvalRange[1] === 100 ? { alpacaEvalRange: [dataRanges.alpacaEval.min, dataRanges.alpacaEval.max] } : {}),
      ...(prev.contextLengthRange[0] === 0 && prev.contextLengthRange[1] === 200000 ? { contextLengthRange: [dataRanges.contextLength.min, dataRanges.contextLength.max] } : {}),
      ...(prev.inputTokenCount === 512 ? { inputTokenCount: dataRanges.inputToken.default } : {}),
    }));
  }, [dataRanges]);

  // Generate performance matrix (depends on input token count for TTFT calculation)
  const performanceMatrix = useMemo(() => {
    const matrix: { [deviceName: string]: { [modelName: string]: DeviceModelPerformance } } = {};

    availableGPUs.forEach(gpu => {
      matrix[gpu.name] = {};
      MODELS.forEach(model => {
        const performance = estimatePerformance(gpu, model, filters.inputTokenCount);
        matrix[gpu.name][model.name] = performance;
      });
    });
    
    return matrix;
  }, [availableGPUs, filters.inputTokenCount]);

  // Filter models based on AlpacaEval and context length
  const filteredModels = useMemo(() => {
    const [alpacaEvalMin, alpacaEvalMax] = filters.alpacaEvalRange;
    const [contextLengthMin, contextLengthMax] = filters.contextLengthRange;

    return MODELS.filter(model => {
      const alpacaEvalMatch = model.alpacaEvalScore >= alpacaEvalMin && model.alpacaEvalScore <= alpacaEvalMax;
      const contextLengthMatch = model.specs.sequenceLength >= contextLengthMin && model.specs.sequenceLength <= contextLengthMax;
      return alpacaEvalMatch && contextLengthMatch;
    });
  }, [filters.alpacaEvalRange, filters.contextLengthRange]);

  // Filter devices and check if cell matches filter criteria (only TTFT, ITL, Budget - model filtering handled separately)
  const checkCellMatch = (performance: DeviceModelPerformance, devicePrice?: number): boolean => {
    if (!performance.canRun) return false;

    const [ttftMin, ttftMax] = filters.ttftRange;
    const [itlMin, itlMax] = filters.itlRange;
    const [budgetMin, budgetMax] = filters.budgetRange;

    const ttftMatch = performance.ttft >= ttftMin && performance.ttft <= ttftMax;
    const itlMatch = performance.itl >= itlMin && performance.itl <= itlMax;
    const budgetMatch = !devicePrice || (devicePrice >= budgetMin && devicePrice <= budgetMax);

    return ttftMatch && itlMatch && budgetMatch;
  };

  const handleSliderChange = (field: keyof FilterState) => 
    (_event: Event, newValue: number | number[]) => {
      if (field === 'inputTokenCount') {
        // Handle single value for input token count
        if (typeof newValue === 'number') {
          setFilters(prev => ({
            ...prev,
            [field]: newValue,
          }));
        }
      } else {
        // Handle ranges for other filters
        if (Array.isArray(newValue) && newValue.length === 2) {
          setFilters(prev => ({
            ...prev,
            [field]: newValue as [number, number],
          }));
        }
      }
    };

  const filteredGPUs = availableGPUs
    .filter(gpu => gpu.price !== undefined) // Only show devices with pricing
    .filter(gpu => {
      // Check if any filtered model on this device matches the filters
      return filteredModels.some(model => {
        const performance = performanceMatrix[gpu.name]?.[model.name];
        return performance && checkCellMatch(performance, gpu.price);
      });
    })
    .sort((a, b) => (a.price || 0) - (b.price || 0)); // Sort by price ascending

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', py: 2, mb: 3 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ fontWeight: 'bold', mb: 2 }}
        >
          AI Stack Finder
        </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: '800px', mx: 'auto' }}
            >
              Find the perfect AI hardware stack for your deployment needs. Compare device-model combinations
              across Time to First Token (TTFT), Inter-Token Latency (ITL), and budget constraints.
              Use the sliders to filter and discover optimal hardware configurations.
              TTFT calculations and filter ranges dynamically adjust based on your input token count.
              Devices are sorted by price (lowest first) and only devices with pricing information are shown.
            </Typography>
      </Box>

      {/* Filters Card */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
              Stack Requirements
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 4,
            alignItems: 'flex-start'
          }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                TTFT Range: {Math.round(filters.ttftRange[0])} - {Math.round(filters.ttftRange[1])} ms
              </Typography>
              <Slider
                value={filters.ttftRange}
                onChange={handleSliderChange('ttftRange')}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value)}ms`}
                min={dataRanges.ttft.min}
                max={dataRanges.ttft.max}
                step={10}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                ITL Range: {Math.round(filters.itlRange[0])} - {Math.round(filters.itlRange[1])} ms
              </Typography>
              <Slider
                value={filters.itlRange}
                onChange={handleSliderChange('itlRange')}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value)}ms`}
                min={dataRanges.itl.min}
                max={dataRanges.itl.max}
                step={5}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Budget Range: ${Math.round(filters.budgetRange[0]).toLocaleString()} - ${Math.round(filters.budgetRange[1]).toLocaleString()}
              </Typography>
              <Slider
                value={filters.budgetRange}
                onChange={handleSliderChange('budgetRange')}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `$${Math.round(value).toLocaleString()}`}
                min={dataRanges.budget.min}
                max={dataRanges.budget.max}
                step={100}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
          
          {/* Second row of filters */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 4,
            alignItems: 'flex-start',
            mt: 3
          }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                AlpacaEval Score: {Math.round(filters.alpacaEvalRange[0])} - {Math.round(filters.alpacaEvalRange[1])}
              </Typography>
              <Slider
                value={filters.alpacaEvalRange}
                onChange={handleSliderChange('alpacaEvalRange')}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value)}`}
                min={dataRanges.alpacaEval.min}
                max={dataRanges.alpacaEval.max}
                step={1}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Context Length: {(filters.contextLengthRange[0] / 1000).toFixed(0)}K - {(filters.contextLengthRange[1] / 1000).toFixed(0)}K tokens
              </Typography>
              <Slider
                value={filters.contextLengthRange}
                onChange={handleSliderChange('contextLengthRange')}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value / 1000).toFixed(0)}K`}
                min={dataRanges.contextLength.min}
                max={dataRanges.contextLength.max}
                step={1000}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Input Tokens: {Math.round(filters.inputTokenCount)} tokens
              </Typography>
              <Slider
                value={filters.inputTokenCount}
                onChange={handleSliderChange('inputTokenCount')}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value)} tokens`}
                min={dataRanges.inputToken.min}
                max={dataRanges.inputToken.max}
                step={64}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Matrix Table Card */}
      <Card elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TableChartIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
              Hardware-Model Compatibility Matrix
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'grey.100',
                      minWidth: 200,
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                    }}
                  >
                    Device
                  </TableCell>
                  {filteredModels.map((model) => (
                    <TableCell 
                      key={model.shortName} 
                      align="center"
                      sx={{ 
                        fontWeight: 'bold', 
                        backgroundColor: 'grey.100',
                        minWidth: 160,
                      }}
                    >
                      {model.name}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {model.specs.parameters}B • {(model.specs.sequenceLength / 1000).toFixed(0)}K context
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        AlpacaEval: {model.alpacaEvalScore}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGPUs.map((gpu) => (
                  <TableRow key={gpu.name}>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'medium',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'background.paper',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        zIndex: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {gpu.name}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>
                          {gpu.computeBandwidth.toFixed(1)} TOPS
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>
                          {gpu.memorySize}GB • {gpu.memoryBandwidth}GB/s
                        </Typography>
                        {gpu.price && (
                          <Chip 
                            label={`$${gpu.price.toLocaleString()}`}
                            size="small"
                            color="secondary"
                            sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    {filteredModels.map((model) => {
                      const performance = performanceMatrix[gpu.name]?.[model.name];
                      const isMatch = performance && checkCellMatch(performance, gpu.price);
                      
                      return (
                        <TableCell 
                          key={model.shortName}
                          align="center"
                          sx={{
                            backgroundColor: !performance?.canRun 
                              ? 'grey.200'
                              : isMatch 
                                ? 'success.light' 
                                : 'background.paper',
                            color: !performance?.canRun 
                              ? 'text.disabled'
                              : isMatch 
                                ? 'success.contrastText'
                                : 'text.primary',
                          }}
                        >
                          {!performance?.canRun ? (
                            <Typography variant="caption" color="text.disabled">
                              Won't fit
                            </Typography>
                          ) : (
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 'medium' }}>
                                TTFT: {performance.ttft.toFixed(0)}ms
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                ITL: {performance.itl.toFixed(0)}ms
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Legend */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  backgroundColor: 'success.light',
                  border: '1px solid',
                  borderColor: 'success.main',
                }} 
              />
              <Typography variant="caption">Matches filters</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }} 
              />
              <Typography variant="caption">Available but doesn't match filters</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  backgroundColor: 'grey.200',
                  border: '1px solid',
                  borderColor: 'grey.400',
                }} 
              />
              <Typography variant="caption">Model won't fit in device memory</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
