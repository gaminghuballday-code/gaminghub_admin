import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  tournamentsApi,
  type GetTournamentsParams,
  type UpdateTournamentRequest,
  type UpdateRoomRequest,
} from '../index';

// Query keys
export const tournamentsKeys = {
  all: ['tournaments'] as const,
  lists: () => [...tournamentsKeys.all, 'list'] as const,
  list: (params?: GetTournamentsParams) =>
    [...tournamentsKeys.lists(), params] as const,
};

/**
 * Hook for fetching tournaments list
 */
export const useTournaments = (params?: GetTournamentsParams, enabled = true) => {
  return useQuery({
    queryKey: tournamentsKeys.list(params),
    queryFn: () => tournamentsApi.getTournaments(params),
    enabled,
  });
};

/**
 * Hook for updating tournament mutation
 */
export const useUpdateTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tournamentId, data }: { tournamentId: string; data: UpdateTournamentRequest }) =>
      tournamentsApi.updateTournament(tournamentId, data),
    onSuccess: () => {
      // Invalidate tournaments list
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.lists() });
    },
  });
};

/**
 * Hook for deleting tournament mutation
 */
export const useDeleteTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tournamentId: string) => tournamentsApi.deleteTournament(tournamentId),
    onSuccess: () => {
      // Invalidate tournaments list
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.lists() });
    },
  });
};

/**
 * Hook for updating room mutation
 */
export const useUpdateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tournamentId, data }: { tournamentId: string; data: UpdateRoomRequest }) =>
      tournamentsApi.updateRoom(tournamentId, data),
    onSuccess: () => {
      // Invalidate tournaments list
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.lists() });
    },
  });
};

