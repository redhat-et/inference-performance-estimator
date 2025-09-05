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
  // Use dimensions from model configuration
  // N = sequence length (context length for attention calculation)
  // d = attention head dimension
  const N = model.sequenceLength; // Use the sequence length as N in the equation
  const d = model.headDimension || 128; // Default to Llama 2 7B if not specified
  
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
 * Calculate time for prefill phase (processing input tokens)
 * Assumes compute-bound operation during prefill
 */
export function calculatePrefillTime(gpu: GPUSpecs, model: ModelSpecs, systemOverhead?: SystemOverhead): number {
  // Prefill time = number of tokens * (number of parameters * 2 FLOP) / compute bandwidth
  // Factor of 2 accounts for forward pass operations
  // Quantization affects compute performance
  const quantInfo = getQuantizationInfo(model.quantization);
  const totalFlops = model.promptTokens * (model.parameters * 1e9) * 2;
  const effectiveComputeFlops = gpu.computeBandwidth * 1e12 * quantInfo.computeMultiplier;
  
  const baseTime = (totalFlops / effectiveComputeFlops) * 1000; // Convert to milliseconds
  const prefillEfficiency = (systemOverhead?.prefillEfficiencyPercent ?? 100) / 100; // Convert percentage to multiplier
  
  return baseTime / prefillEfficiency; // Lower efficiency = higher time
}

/**
 * Calculate time per token during generation phase
 * Assumes memory-bound operation for single token generation
 */
export function calculateTimePerToken(gpu: GPUSpecs, model: ModelSpecs, systemOverhead?: SystemOverhead): number {
  // Time per token = model size in bytes / memory bandwidth
  // Model size depends on quantization
  const modelSizeBytes = calculateModelSizeBytes(model);
  const memoryBytesPerSecond = gpu.memoryBandwidth * 1e9;
  
  const baseTime = (modelSizeBytes / memoryBytesPerSecond) * 1000; // Convert to milliseconds
  const decodeEfficiency = (systemOverhead?.decodeEfficiencyPercent ?? 100) / 100; // Convert percentage to multiplier
  
  return baseTime / decodeEfficiency; // Lower efficiency = higher time
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
 * Using formula: kv_cache_size = 2 * n_layers * d_model * bytes_per_param (for key + value)
 * where d_model = d_head * n_heads
 */
function calculateKVCachePerToken(model: ModelSpecs): number {
  // Use hardcoded model architecture parameters
  const nLayers = model.nLayers || 32; // Default to Llama 2 7B if not specified
  const dHead = model.headDimension || 128; // Default to Llama 2 7B if not specified
  const nHeads = model.nHeads || 32; // Default to Llama 2 7B if not specified
  const dModel = dHead * nHeads; // Calculate d_model from d_head * n_heads
  const quantInfo = getQuantizationInfo(model.quantization);
  
  // KV cache stores both key and value for each layer, for each token
  // Formula: 2 * n_layers * d_model * bytes_per_param (key + value)
  const kvCacheBytesPerToken = 2 * nLayers * dModel * quantInfo.bytesPerParameter;
  
  return kvCacheBytesPerToken / 1e9; // Convert to GB
}

/**
 * Check if model fits in GPU memory and calculate memory utilization
 */
function checkMemoryFit(gpu: GPUSpecs, model: ModelSpecs): {
  modelSizeGB: number;
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
  const modelSizeGB = modelSizeBytes / (1e9); // Convert to GB
  const gpuMemoryGB = gpu.memorySize;
  
  const totalMemoryNeeded = modelSizeGB;
  
  // Calculate KV cache memory usage using proper formula
  const kvCachePerTokenGB = calculateKVCachePerToken(model);
  const currentKVCacheGB = kvCachePerTokenGB * model.sequenceLength * model.batchSize;
  const totalMemoryWithKV = totalMemoryNeeded + currentKVCacheGB;
  
  // Calculate free memory available for KV cache
  const freeMemoryForKVCacheGB = Math.max(0, gpuMemoryGB - totalMemoryNeeded);
  
  // Calculate maximum tokens that can fit in KV cache
  const maxKVCacheTokens = kvCachePerTokenGB > 0 ? Math.floor(freeMemoryForKVCacheGB / kvCachePerTokenGB) : 0;
  
  // Calculate maximum batch size based on available memory
  const maxBatchSize = model.sequenceLength > 0 ? Math.floor(maxKVCacheTokens / model.sequenceLength) : 0;
  
  const memoryUtilization = (totalMemoryWithKV / gpuMemoryGB) * 100;
  
  let hasMemoryWarning = false;
  let memoryWarningMessage: string | undefined;
  
  if (totalMemoryWithKV > gpuMemoryGB) {
    hasMemoryWarning = true;
    const shortfall = totalMemoryWithKV - gpuMemoryGB;
    memoryWarningMessage = `Model requires ${totalMemoryWithKV.toFixed(1)}GB but GPU only has ${gpuMemoryGB}GB. Shortfall: ${shortfall.toFixed(1)}GB. Consider using a smaller model, better quantization, or a GPU with more memory.`;
  } else if (memoryUtilization > 90) {
    hasMemoryWarning = true;
    memoryWarningMessage = `High memory usage (${memoryUtilization.toFixed(1)}%). May cause performance issues or OOM errors. Consider reducing batch size or sequence length.`;
  } else if (memoryUtilization > 80) {
    hasMemoryWarning = true;
    memoryWarningMessage = `Moderate memory usage (${memoryUtilization.toFixed(1)}%). Monitor for potential memory pressure.`;
  }
  
  const totalMemoryUsedGB = (memoryUtilization / 100) * gpuMemoryGB;

  return {
    modelSizeGB,
    memoryUtilization: Math.min(memoryUtilization, 999), // Cap at 999% for display
    hasMemoryWarning,
    memoryWarningMessage,
    kvCachePerTokenGB,
    freeMemoryForKVCacheGB,
    maxKVCacheTokens,
    maxBatchSize,
    totalMemoryUsedGB,
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
}
