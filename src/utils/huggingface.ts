import type { ModelPreset, QuantizationType } from '../types/calculator';

interface HuggingFaceConfig {
  architectures?: string[];
  hidden_size?: number;
  intermediate_size?: number;
  max_position_embeddings?: number;
  num_attention_heads?: number;
  num_hidden_layers?: number;
  num_key_value_heads?: number;
  vocab_size?: number;
  rope_theta?: number;
  rms_norm_eps?: number;
  tie_word_embeddings?: boolean;
  torch_dtype?: string;
  transformers_version?: string;
  model_type?: string;
  bos_token_id?: number;
  eos_token_id?: number;
  pad_token_id?: number;
  // Parameter count fields that might be in config
  num_parameters?: number;
  total_params?: number;
  _num_parameters?: number;
  [key: string]: any;
}

interface ModelInfo {
  id: string;
  tags?: string[];
  downloads?: number;
  likes?: number;
  library_name?: string;
  pipeline_tag?: string;
  [key: string]: any;
}

export interface HFModelSearchResult {
  models: ModelInfo[];
  nextCursor?: string;
}

/**
 * Search for models on Hugging Face Hub
 */
export async function searchModels(
  query: string = '',
  options: {
    limit?: number;
    sort?: 'trending' | 'downloads' | 'likes' | 'updated';
    direction?: -1 | 1;
    filter?: string;
    full?: boolean;
  } = {}
): Promise<HFModelSearchResult> {
  try {
    const searchParams = new URLSearchParams();
    
    if (query) {
      searchParams.append('search', query);
    }
    
    searchParams.append('limit', (options.limit || 20).toString());
    
    if (options.sort) {
      searchParams.append('sort', options.sort);
    }
    
    if (options.direction) {
      searchParams.append('direction', options.direction.toString());
    }
    
    if (options.filter) {
      searchParams.append('filter', options.filter);
    }
    
    if (options.full) {
      searchParams.append('full', 'true');
    }

    const response = await fetch(`https://huggingface.co/api/models?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search models: ${response.statusText}`);
    }
    
    const models = await response.json();
    
    return {
      models: models || []
    };
  } catch (error) {
    console.error('Error searching models:', error);
    throw new Error('Failed to search models from Hugging Face Hub');
  }
}

/**
 * Load model configuration from Hugging Face Hub
 */
export async function loadModelConfig(modelId: string): Promise<HuggingFaceConfig> {
  try {
    // Direct URL to the config.json file on Hugging Face Hub
    const configUrl = `https://huggingface.co/${modelId}/resolve/main/config.json`;

    const response = await fetch(configUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch config for ${modelId}: ${response.statusText}`);
    }
    
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Error loading model config:', error);
    throw new Error(`Failed to load configuration for model ${modelId}`);
  }
}

/**
 * Load model.safetensors.index.json which contains parameter count
 */
export async function loadSafetensorsIndex(modelId: string): Promise<any> {
  try {
    const indexUrl = `https://huggingface.co/${modelId}/resolve/main/model.safetensors.index.json`;
    const response = await fetch(indexUrl);
    
    if (!response.ok) {
      console.warn(`Could not fetch safetensors index for ${modelId}: ${response.statusText}`);
      return null;
    }
    
    const safetensorsIndex = await response.json();
    return safetensorsIndex;
  } catch (error) {
    console.warn('Error loading safetensors index:', error);
    return null;
  }
}

/**
 * Load additional model information from Hugging Face Hub API
 */
export async function loadModelInfo(modelId: string): Promise<any> {
  try {
    const response = await fetch(`https://huggingface.co/api/models/${modelId}`);
    
    if (!response.ok) {
      // Don't throw error for API info, just return null
      console.warn(`Could not fetch model info for ${modelId}: ${response.statusText}`);
      return null;
    }
    
    const modelInfo = await response.json();
    return modelInfo;
  } catch (error) {
    console.warn('Error loading model info:', error);
    return null;
  }
}

/**
 * Get model parameters from multiple sources with priority order
 * Priority: 1) safetensors total_size / data_type_size, 2) safetensors metadata, 3) config fields, 4) API model info, 5) estimation
 */
function getModelParameters(config: HuggingFaceConfig, safetensorsIndex: any = null, modelInfo: any = null): number {
  // Get model name for debugging only
  const modelName = config._name_or_path || modelInfo?.id || 'unknown';

  // Helper function to get bytes per parameter from torch_dtype
  const getBytesPerParameter = (torchDtype: string | undefined): number => {
    if (!torchDtype) return 2; // Default to FP16 (2 bytes)
    
    const dtype = torchDtype.toLowerCase();
    if (dtype.includes('float32') || dtype.includes('fp32')) return 4;
    if (dtype.includes('float16') || dtype.includes('fp16') || dtype.includes('bfloat16') || dtype.includes('bf16')) return 2;
    if (dtype.includes('int8')) return 1;
    if (dtype.includes('int4')) return 0.5;
    
    return 2; // Default to FP16
  };

  // First priority: safetensors index total_size divided by data type size
  if (safetensorsIndex && safetensorsIndex.metadata && safetensorsIndex.metadata.total_size) {
    const totalSizeBytes = Number(safetensorsIndex.metadata.total_size);
    
    if (!isNaN(totalSizeBytes) && isFinite(totalSizeBytes) && totalSizeBytes > 0) {
      const bytesPerParam = getBytesPerParameter(config.torch_dtype);
      const totalParams = totalSizeBytes / bytesPerParam;
      const paramsBillions = totalParams / 1_000_000_000;
      
      console.log(`Calculated ${paramsBillions.toFixed(2)}B parameters from safetensors total_size (${totalSizeBytes} bytes / ${bytesPerParam} bytes per param)`);
      return paramsBillions;
    }
  }

  // Helper function to validate and convert parameter count
  const validateParamCount = (value: any): number | null => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num) || num <= 0) {
      return null;
    }
    return num / 1_000_000_000; // Convert to billions
  };

  // Second priority: explicit parameter count fields in safetensors metadata
  if (safetensorsIndex && safetensorsIndex.metadata) {
    let paramCount = validateParamCount(safetensorsIndex.metadata.num_params);
    if (paramCount !== null) return paramCount;

    paramCount = validateParamCount(safetensorsIndex.metadata.total_params);
    if (paramCount !== null) return paramCount;

    paramCount = validateParamCount(safetensorsIndex.metadata.parameters);
    if (paramCount !== null) return paramCount;
  }

  // Third priority: config file parameter fields
  let paramCount = validateParamCount(config.num_parameters);
  if (paramCount !== null) return paramCount;

  paramCount = validateParamCount(config.total_params);
  if (paramCount !== null) return paramCount;

  paramCount = validateParamCount(config._num_parameters);
  if (paramCount !== null) return paramCount;

  // Fourth priority: model info API response
  if (modelInfo) {
    if (modelInfo.safetensors && modelInfo.safetensors.parameters) {
      paramCount = validateParamCount(modelInfo.safetensors.parameters);
      if (paramCount !== null) return paramCount;
    }
    
    if (modelInfo.pytorch_model && modelInfo.pytorch_model.parameters) {
      paramCount = validateParamCount(modelInfo.pytorch_model.parameters);
      if (paramCount !== null) return paramCount;
    }

    if (modelInfo.transformersInfo && modelInfo.transformersInfo.parameters) {
      paramCount = validateParamCount(modelInfo.transformersInfo.parameters);
      if (paramCount !== null) return paramCount;
    }
  }

  // Last resort: estimate from architecture
  console.warn(`Could not find parameter count for ${modelName} in safetensors, config, or model info - falling back to estimation`);
  const estimated = estimateParametersFromArchitecture(config);
  
  // Validate estimation result
  if (isNaN(estimated) || !isFinite(estimated) || estimated <= 0) {
    console.error(`Architecture estimation failed for ${modelName}, using default 7B`);
    return 7.0; // Default to 7B if all else fails
  }
  
  return estimated;
}

/**
 * Fallback estimation when no parameter count is available
 */
function estimateParametersFromArchitecture(config: HuggingFaceConfig): number {
  // Validate input values and provide safe defaults
  const hidden_size = Math.max(Number(config.hidden_size) || 4096, 1);
  const intermediate_size = Math.max(Number(config.intermediate_size) || 11008, 1);
  const num_hidden_layers = Math.max(Number(config.num_hidden_layers) || 32, 1);
  const vocab_size = Math.max(Number(config.vocab_size) || 32000, 1);

  // Rough estimation based on transformer architecture
  // This is a simplified calculation and may not be 100% accurate
  const embedding_params = vocab_size * hidden_size;
  const attention_params = num_hidden_layers * (
    4 * hidden_size * hidden_size + // Q, K, V, O projections
    hidden_size // layer norm
  );
  const mlp_params = num_hidden_layers * (
    hidden_size * intermediate_size * 2 + // up and down projections
    hidden_size // layer norm
  );
  const final_layer_norm = hidden_size;
  
  const total_params = embedding_params + attention_params + mlp_params + final_layer_norm;
  
  // Convert to billions and validate
  const result = total_params / 1_000_000_000;
  
  // Ensure we don't return invalid values
  if (isNaN(result) || !isFinite(result) || result <= 0) {
    console.error('Architecture estimation produced invalid result, using 7B default');
    return 7.0;
  }
  
  return result;
}

/**
 * Map model's torch_dtype to quantization type
 */
function getQuantizationFromTorchDtype(config: HuggingFaceConfig): QuantizationType {
  // Use the model's default tensor type (torch_dtype)
  if (config.torch_dtype) {
    const dtype = config.torch_dtype.toLowerCase();
    if (dtype.includes('float32') || dtype.includes('fp32')) return 'FP32';
    if (dtype.includes('float16') || dtype.includes('fp16') || dtype.includes('bfloat16') || dtype.includes('bf16')) return 'FP16';
    if (dtype.includes('int8')) return 'INT8';
    if (dtype.includes('int4')) return 'INT4';
  }
  
  // Default to FP16 if no torch_dtype specified (most common for modern models)
  return 'FP16';
}

/**
 * Convert Hugging Face config to ModelPreset
 */
export function configToModelPreset(modelId: string, config: HuggingFaceConfig, safetensorsIndex: any = null, modelInfo: any = null): ModelPreset {
  // Helper to safely convert and validate numeric values
  const safeNumber = (value: any, defaultValue: number): number => {
    const num = Number(value);
    return (isNaN(num) || !isFinite(num) || num <= 0) ? defaultValue : num;
  };

  const parameters = getModelParameters(config, safetensorsIndex, modelInfo);
  const sequenceLength = safeNumber(config.max_position_embeddings, 4096);
  const hiddenSize = safeNumber(config.hidden_size, 4096);
  const numAttentionHeads = safeNumber(config.num_attention_heads, 32);
  
  const headDimension = hiddenSize / numAttentionHeads;
  const nLayers = safeNumber(config.num_hidden_layers, 32);
  const nHeads = numAttentionHeads;
  const defaultQuantization = getQuantizationFromTorchDtype(config);

  return {
    name: modelId,
    parameters,
    sequenceLength,
    headDimension,
    nLayers,
    nHeads,
    defaultQuantization,
  };
}

/**
 * Load a model preset from Hugging Face Hub
 */
export async function loadModelFromHub(modelId: string): Promise<ModelPreset> {
  try {
    // Load config, safetensors index, and model info in parallel
    const [config, safetensorsIndex, modelInfo] = await Promise.all([
      loadModelConfig(modelId),
      loadSafetensorsIndex(modelId),
      loadModelInfo(modelId)
    ]);
    
    return configToModelPreset(modelId, config, safetensorsIndex, modelInfo);
  } catch (error) {
    console.error('Error loading model from hub:', error);
    throw error;
  }
}

/**
 * Suggested model presets for quick access
 */
export const SUGGESTED_MODELS = [
  'ibm-granite/granite-3.3-2b-instruct',
  'ibm-granite/granite-3.3-8b-instruct'
];
