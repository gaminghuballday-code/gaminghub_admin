import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../index';

// Query keys
export const healthKeys = {
  all: ['health'] as const,
  check: () => [...healthKeys.all, 'check'] as const,
};

/**
 * Hook for checking health status
 */
export const useHealthCheck = (enabled = true) => {
  return useQuery({
    queryKey: healthKeys.check(),
    queryFn: () => healthApi.checkHealth(),
    enabled,
    // Health check should refetch more frequently
    refetchInterval: 30000, // 30 seconds
  });
};

