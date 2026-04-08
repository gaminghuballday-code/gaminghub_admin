import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { specialTournamentApi, type CreateSpecialTournamentRequest, type SpecialTournamentListParams } from '../index';

export const specialTournamentKeys = {
  all: ['special-tournament'] as const,
  lists: () => [...specialTournamentKeys.all, 'list'] as const,
  list: (params?: SpecialTournamentListParams) => [...specialTournamentKeys.lists(), params] as const,
};

export const useSpecialTournamentsList = (params?: SpecialTournamentListParams, enabled = true) => {
  return useQuery({
    queryKey: specialTournamentKeys.list(params),
    queryFn: () => specialTournamentApi.list(params),
    enabled,
  });
};

export const useCreateSpecialTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSpecialTournamentRequest) => specialTournamentApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialTournamentKeys.lists() });
    },
  });
};

