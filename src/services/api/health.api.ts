import { apolloClient } from './graphql/client';
import { HEALTH_CHECK_QUERY } from './graphql/queries';
import type { HealthResponse } from '../types/api.types';

export const healthApi = {
  /**
   * Check API health status
   */
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await apolloClient.query<{ health: HealthResponse }>({
      query: HEALTH_CHECK_QUERY,
      fetchPolicy: 'network-only',
    });
    return response.data?.health || { status: 'unknown', timestamp: new Date().toISOString() };
  },
};

