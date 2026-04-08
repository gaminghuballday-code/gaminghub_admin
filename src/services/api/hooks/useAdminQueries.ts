import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../admin.api';

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  analytics: (period: string) => [...adminKeys.all, 'analytics', period] as const,
};

/**
 * Hook for fetching platform statistics
 */
export const usePlatformStats = (enabled = true) => {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => adminApi.getPlatformStats(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/**
 * Hook for fetching analytical reports
 */
export const useAnalytics = (period: 'daily' | 'weekly' | 'monthly' = 'daily', enabled = true) => {
  return useQuery({
    queryKey: adminKeys.analytics(period),
    queryFn: () => adminApi.getAnalytics(period),
    enabled,
    staleTime: 300000, // 5 minutes
  });
};
