import { useHealthCheck } from '@services/api/hooks';

export const useHealthStatusLogic = () => {
  // Health check using TanStack Query
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: checkHealth,
  } = useHealthCheck(true);

  return {
    healthData,
    healthLoading,
    healthError,
    checkHealth,
  };
};

