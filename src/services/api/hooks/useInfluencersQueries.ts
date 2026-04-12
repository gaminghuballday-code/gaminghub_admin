import { useMutation, useQueryClient } from '@tanstack/react-query';
import { influencersApi, type InviteInfluencerRequest } from '../influencers.api';
import { usersKeys } from './useUsersQueries';

export const useInviteInfluencer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteInfluencerRequest) => influencersApi.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
};
