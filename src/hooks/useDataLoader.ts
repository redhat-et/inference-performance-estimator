import { useState, useEffect } from 'react';
import type { GPUSpecs } from '../types/calculator';
import gpusData from '../data/gpus.json';

export const useGPUs = () => {
  const [gpus, setGPUs] = useState<GPUSpecs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate async loading to maintain consistent API
    const loadGPUs = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to show loading state
        setGPUs(gpusData as GPUSpecs[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadGPUs();
  }, []);

  return { gpus, loading, error };
};

