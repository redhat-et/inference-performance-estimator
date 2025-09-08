import type { GPUSpecs, ModelSpecs, CalculationResults, QuantizationInfo, SystemOverhead } from '../types/calculator';
import { QUANTIZATION_OPTIONS } from '../types/calculator';

/**
 * Get quantization information for a given quantization type
 */
function getQuantizationInfo(quantization: string): QuantizationInfo {
  return QUANTIZATION_OPTIONS.find(q => q.name === quantization) || QUANTIZATION_OPTIONS[1]; // Default to FP16
}

/**
 * Calculate model size in bytes based on parameters and quantization
 */
function calculateModelSizeBytes(model: ModelSpecs): number {
  const quantInfo = getQuantizationInfo(model.quantization);
  return model.parameters * 1e9 * quantInfo.bytesPerParameter;
}

/**
 * Calculate the operations-to-byte ratio of a GPU scaled by model quantization
 * This tells us how many FLOPS we can complete for every byte of memory access
 * Lower precision quantization increases effective compute throughput
 */
export function calculateOpsToByteRatio(gpu: GPUSpecs, model: ModelSpecs): number {
  const quantInfo = getQuantizationInfo(model.quantization);
  
  // Scale compute bandwidth based on quantization efficiency
  // Lower precision operations can achieve higher throughput
  const effectiveComputeFlops = gpu.computeBandwidth * 1e12 * quantInfo.computeMultiplier; // TFLOPS to FLOPS, scaled
  const memoryBytesPerSecond = gpu.memoryBandwidth * 1e9; // GB/s to bytes/s
  
  return effectiveComputeFlops / memoryBytesPerSecond;
}

/**
 * Calculate arithmetic intensity for transformer attention operations
 * Using exact formula from Baseten blog: https://www.baseten.co/blog/llm-transformer-inference-guide/
 * 
 * Breaking down the attention equation step by step:
 * total_memory_movement = 8N^2 + 8Nd bytes
 * total_compute = 4(N^2)d + 3N^2 ops  
 * arithmetic_intensity = total_compute / total_memory_movement
 */
export function calculateArithmeticIntensity(model: ModelSpecs): number {
  // Validate required parameters
  if (!model.headDimension) {
    throw new Error('Model architecture missing: headDimension is required for arithmetic intensity calculation');
  }
  
  // Use dimensions from model configuration
  // N = sequence length (context length for attention calculation)
  // d = attention head dimension
  const N = model.sequenceLength; // Use the sequence length as N in the equation
  const d = model.headDimension;
  
  // From Baseten's detailed attention breakdown:
  // Memory movement in bytes (accounting for quantization):
  // = (2 * 2 * (N * d)) + (2 * (N * N)) + (2 * ((N*N) + (N * d))) + (2 * (N * N)) + (2 * (N * N)) + (2 * (N * d))
  // = 8N^2 + 8Nd bytes
  
  const quantInfo = getQuantizationInfo(model.quantization);
  const totalMemoryMovement = (8 * N * N + 8 * N * d) * quantInfo.bytesPerParameter / 2; // Adjust for quantization vs FP16 baseline
  
  // Compute operations (from summing the second column in their table):
  // = ((2 * d) * (N * N)) + (3 * (N * N)) + ((2 * N) * (N * d))
  // = 4(N^2)d + 3N^2 ops
  const totalCompute = 4 * N * N * d + 3 * N * N;
  
  // Arithmetic intensity = total compute / total memory movement
  let arithmeticIntensity = totalCompute / totalMemoryMovement;
  
  // Apply batching effect - operations scale with batch size but memory movement stays constant
  arithmeticIntensity = arithmeticIntensity * model.batchSize;
  
  return Math.max(0.1, arithmeticIntensity); // Minimum realistic bound
}

/**
 * Calculate time to first token (processing input tokens before generation begins)
 * Assumes compute-bound operation for initial processing
 */
export function calculatePrefillTime(gpu: GPUSpecs, model: ModelSpecs, systemOverhead?: SystemOverhead): number {
  // Time to first token = number of tokens * (number of parameters * 2 FLOP) / compute bandwidth
  // Factor of 2 accounts for forward pass operations
  // Quantization affects compute performance
  const quantInfo = getQuantizationInfo(model.quantization);
  const totalFlops = model.promptTokens * (model.parameters * 1e9) * 2;
  const effectiveComputeFlops = gpu.computeBandwidth * 1e12 * quantInfo.computeMultiplier;
  
  const baseTime = (totalFlops / effectiveComputeFlops) * 1000; // Convert to milliseconds
  const systemEfficiency = (systemOverhead?.systemEfficiencyPercent ?? 100) / 100; // Convert percentage to multiplier
  
  return baseTime / systemEfficiency; // Lower efficiency = higher time
}

/**
 * Calculate inter token latency during generation phase
 * Assumes memory-bound operation for single token generation
 */
export function calculateTimePerToken(gpu: GPUSpecs, model: ModelSpecs, systemOverhead?: SystemOverhead): number {
  // Inter token latency = model size in bytes / memory bandwidth
  // Model size depends on quantization
  const modelSizeBytes = calculateModelSizeBytes(model);
  const memoryBytesPerSecond = gpu.memoryBandwidth * 1e9;
  
  const baseTime = (modelSizeBytes / memoryBytesPerSecond) * 1000; // Convert to milliseconds
  const systemEfficiency = (systemOverhead?.systemEfficiencyPercent ?? 100) / 100; // Convert percentage to multiplier
  
  return baseTime / systemEfficiency; // Lower efficiency = higher time
}

/**
 * Calculate total generation time
 */
export function calculateTotalGenerationTime(
  prefillTime: number,
  timePerToken: number,
  outputTokens: number
): number {
  return prefillTime + (timePerToken * outputTokens);
}

/**
 * Calculate throughput in tokens per second
 */
export function calculateThroughput(totalTime: number, totalTokens: number): number {
  if (totalTime === 0) return 0;
  return (totalTokens / totalTime) * 1000; // Convert from tokens/ms to tokens/s
}

/**
 * Determine if the operation is memory-bound or compute-bound
 */
export function determineBottleneck(opsToByteRatio: number, arithmeticIntensity: number): {
  isMemoryBound: boolean;
  isComputeBound: boolean;
} {
  return {
    isMemoryBound: arithmeticIntensity < opsToByteRatio,
    isComputeBound: arithmeticIntensity >= opsToByteRatio,
  };
}

/**
 * Calculate KV cache memory usage per token
 * Using formula from HBM Calculator: 2 * n_layers * n_kv_heads * head_dims * bytes_per_param
 * More accurate for grouped-query attention models
 */
function calculateKVCachePerToken(model: ModelSpecs): number {
  // Validate all required parameters are present
  if (!model.nLayers) {
    throw new Error('Model architecture missing: nLayers is required for KV cache calculation');
  }
  if (!model.headDimension) {
    throw new Error('Model architecture missing: headDimension is required for KV cache calculation');
  }
  if (!model.nKvHeads && !model.nHeads) {
    throw new Error('Model architecture missing: nKvHeads or nHeads is required for KV cache calculation');
  }

  const nLayers = model.nLayers;
  const dHead = model.headDimension;
  const nKvHeads = model.nKvHeads || model.nHeads!; // nKvHeads takes priority, fallback to nHeads (guaranteed non-null by check above)
  const quantInfo = getQuantizationInfo(model.quantization);
  
  // KV cache stores both key and value for each layer, for each token
  // Formula from HBM Calculator: 2 * n_layers * n_kv_heads * head_dims * bytes_per_param (key + value)
  const kvCacheBytesPerToken = 2 * nLayers * nKvHeads * dHead * quantInfo.bytesPerParameter;
  
  return kvCacheBytesPerToken / (1000 ** 3); // Convert to GB using same factor as notebook
}

/**
 * Calculate PyTorch activation memory usage
 * Using formula from HBM Calculator: max_num_sequences * sequence_length * (18 * hidden_size + 4 * intermediate_size)
 * This accounts for intermediate calculations during forward pass
 */
function calculateActivationMemory(model: ModelSpecs): number {
  // Validate required architecture parameters are present
  if (!model.hiddenSize) {
    throw new Error('Model architecture missing: hiddenSize is required for activation memory calculation');
  }
  if (!model.intermediateSize) {
    throw new Error('Model architecture missing: intermediateSize is required for activation memory calculation');
  }

  const hiddenSize = model.hiddenSize;
  const intermediateSize = model.intermediateSize;
  const sequenceLength = model.promptTokens + model.outputTokens;
  const maxNumSequences = model.batchSize;
  
  // PyTorch activation memory scales with batch size and sequence length
  // Formula from HBM Calculator: max_num_sequences * sequence_length * (18 * hidden_size + 4 * intermediate_size)
  // Note: coefficients (18, 4) are already in bytes, no need for data type scaling
  const activationMemoryBytes = maxNumSequences * sequenceLength * (18 * hiddenSize + 4 * intermediateSize);
  const activationMemoryGB = activationMemoryBytes / (1000 ** 3);
  
  return activationMemoryGB;
}

/**
 * Calculate fixed system overhead memory
 * Based on HBM Calculator: Fixed 1GB for CUDA kernels, runtime, etc.
 */
function calculateSystemOverhead(): number {
  return 1.0; // Fixed 1GB overhead
}

/**
 * Check if model fits in GPU memory and calculate memory utilization
 */
function checkMemoryFit(gpu: GPUSpecs, model: ModelSpecs): {
  modelSizeGB: number;
  systemOverheadGB: number;
  activationMemoryGB: number;
  memoryUtilization: number;
  hasMemoryWarning: boolean;
  memoryWarningMessage?: string;
  kvCachePerTokenGB: number;
  freeMemoryForKVCacheGB: number;
  maxKVCacheTokens: number;
  maxBatchSize: number;
  totalMemoryUsedGB: number;
  currentKVCacheGB: number;
} {
  const modelSizeBytes = calculateModelSizeBytes(model);
  const modelSizeGB = modelSizeBytes / (1000 ** 3); // Convert to GB using same factor as notebook
  const gpuMemoryGB = gpu.memorySize;
  
  // Calculate all memory components following HBM Calculator approach
  const systemOverheadGB = calculateSystemOverhead(); // Fixed 1GB
  const activationMemoryGB = calculateActivationMemory(model); // Dynamic based on batch/sequence
  const kvCachePerTokenGB = calculateKVCachePerToken(model);
  const currentKVCacheGB = kvCachePerTokenGB * (model.promptTokens + model.outputTokens) * model.batchSize;
  
  // Total memory needed = model weights + system overhead + activation memory + KV cache
  const totalMemoryNeeded = modelSizeGB + systemOverheadGB + activationMemoryGB + currentKVCacheGB;
  
  // Calculate free memory available for additional KV cache
  const baseMemoryUsage = modelSizeGB + systemOverheadGB + activationMemoryGB;
  const freeMemoryForKVCacheGB = Math.max(0, gpuMemoryGB - baseMemoryUsage);
  
  // Calculate maximum tokens that can fit in KV cache
  const maxKVCacheTokens = kvCachePerTokenGB > 0 ? Math.floor(freeMemoryForKVCacheGB / kvCachePerTokenGB) : 0;
  
  // Calculate maximum batch size based on available memory
  const actualSequenceLength = model.promptTokens + model.outputTokens;
  const maxBatchSize = actualSequenceLength > 0 ? Math.floor(maxKVCacheTokens / actualSequenceLength) : 0;
  
  const memoryUtilization = (totalMemoryNeeded / gpuMemoryGB) * 100;
  
  let hasMemoryWarning = false;
  let memoryWarningMessage: string | undefined;
  
  if (totalMemoryNeeded > gpuMemoryGB) {
    hasMemoryWarning = true;
    const shortfall = totalMemoryNeeded - gpuMemoryGB;
    memoryWarningMessage = `Model requires ${totalMemoryNeeded.toFixed(1)}GB but GPU only has ${gpuMemoryGB}GB. Shortfall: ${shortfall.toFixed(1)}GB. Consider using a smaller model, better quantization, or a GPU with more memory.`;
  } else if (memoryUtilization > 90) {
    hasMemoryWarning = true;
    memoryWarningMessage = `High memory usage (${memoryUtilization.toFixed(1)}%). May cause performance issues or OOM errors. Consider reducing batch size or sequence length.`;
  } else if (memoryUtilization > 80) {
    hasMemoryWarning = true;
    memoryWarningMessage = `Moderate memory usage (${memoryUtilization.toFixed(1)}%). Monitor for potential memory pressure.`;
  }
  
  return {
    modelSizeGB,
    systemOverheadGB,
    activationMemoryGB,
    memoryUtilization: Math.min(memoryUtilization, 999), // Cap at 999% for display
    hasMemoryWarning,
    memoryWarningMessage,
    kvCachePerTokenGB,
    freeMemoryForKVCacheGB,
    maxKVCacheTokens,
    maxBatchSize,
    totalMemoryUsedGB: totalMemoryNeeded,
    currentKVCacheGB,
  };
}

/**
 * Check if performance is acceptable and create warning if needed
 */
function checkPerformanceWarning(throughput: number): {
  hasPerformanceWarning: boolean;
  performanceWarningMessage?: string;
} {
  const minAcceptableThroughput = 5; // tokens per second
  
  if (throughput < minAcceptableThroughput) {
    return {
      hasPerformanceWarning: true,
      performanceWarningMessage: `Very low throughput (${throughput.toFixed(1)} token/s). Consider using a more powerful GPU, smaller model, better quantization, or optimizing your setup for better performance.`,
    };
  }
  
  return {
    hasPerformanceWarning: false,
  };
}

/**
 * Main calculation function that computes all performance metrics
 */
export function calculatePerformance(gpu: GPUSpecs, model: ModelSpecs, systemOverhead?: SystemOverhead): CalculationResults {
  try {
    const opsToByteRatio = calculateOpsToByteRatio(gpu, model);
    const arithmeticIntensity = calculateArithmeticIntensity(model);
    const bottleneck = determineBottleneck(opsToByteRatio, arithmeticIntensity);
    const memoryCheck = checkMemoryFit(gpu, model);
    
    const prefillTime = calculatePrefillTime(gpu, model, systemOverhead);
    const timePerToken = calculateTimePerToken(gpu, model, systemOverhead);
    const totalGenerationTime = calculateTotalGenerationTime(
      prefillTime,
      timePerToken,
      model.outputTokens
    );
    
    const totalTokens = model.promptTokens + model.outputTokens;
    const throughputTokensPerSecond = calculateThroughput(totalGenerationTime, totalTokens);
    const performanceCheck = checkPerformanceWarning(throughputTokensPerSecond);
    
    return {
      opsToByteRatio,
      arithmeticIntensity,
      ...bottleneck,
      prefillTime,
      timePerToken,
      totalGenerationTime,
      throughputTokensPerSecond,
      ...memoryCheck,
      ...performanceCheck,
    };
  } catch (error) {
    // Re-throw the error with context about where it occurred
    const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
    throw new Error(`Performance calculation failed: ${errorMessage}`);
  }
}
