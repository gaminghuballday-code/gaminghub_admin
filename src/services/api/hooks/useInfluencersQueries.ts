import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  influencersApi,
  type InviteInfluencerRequest,
  type GetInfluencerStatisticsParams,
} from '../influencers.api';
import { usersKeys } from './useUsersQueries';

export const influencersKeys = {
  all: ['influencers'] as const,
  statistics: (params?: GetInfluencerStatisticsParams) =>
    [...influencersKeys.all, 'statistics', params ?? {}] as const,
};

export const useInviteInfluencer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteInfluencerRequest) => influencersApi.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: influencersKeys.all });
    },
  });
};

/**
 * Static influencer statistics (fetches when tab is active, like host statistics).
 */
export const useInfluencerStatistics = (
  params?: GetInfluencerStatisticsParams,
  enabled = true
) => {
  return useQuery({
    queryKey: influencersKeys.statistics(params),
    queryFn: () => influencersApi.getInfluencerStatistics(params),
    enabled,
  });
};
