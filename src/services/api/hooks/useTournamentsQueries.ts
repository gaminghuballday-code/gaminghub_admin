import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  tournamentsApi,
  type GetTournamentsParams,
  type UpdateTournamentRequest,
  type UpdateRoomRequest,
  type JoinTournamentRequest,
} from '../index';

// Query keys
export const tournamentsKeys = {
  all: ['tournaments'] as const,
  lists: () => [...tournamentsKeys.all, 'list'] as const,
  list: (params?: GetTournamentsParams) =>
    [...tournamentsKeys.lists(), params] as const,
  userLists: () => [...tournamentsKeys.all, 'user', 'list'] as const,
  userList: (params?: { status?: string }) =>
    [...tournamentsKeys.userLists(), params] as const,
  joined: () => [...tournamentsKeys.all, 'user', 'joined'] as const,
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
 * Hook for fetching tournaments list for users
 */
export const useUserTournaments = (params?: { status?: string }, enabled = true) => {
  return useQuery({
    queryKey: tournamentsKeys.userList(params),
    queryFn: () => tournamentsApi.getUserTournaments(params),
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
 * Hook for updating room mutation (Admin only)
 */
export const useUpdateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tournamentId, data }: { tournamentId: string; data: Omit<UpdateRoomRequest, 'tournamentId'> }) =>
      tournamentsApi.updateRoom(tournamentId, data),
    onSuccess: () => {
      // Invalidate tournaments list
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.lists() });
    },
  });
};

/**
 * Hook for updating room mutation (Host or Admin only)
 */
export const useUpdateRoomForUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRoomRequest) => tournamentsApi.updateRoomForUser(data),
    onSuccess: () => {
      // Invalidate user tournaments list and joined tournaments
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.userLists() });
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.joined() });
    },
  });
};

/**
 * Hook for joining a tournament (User only)
 */
export const useJoinTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinTournamentRequest) => tournamentsApi.joinTournament(data),
    onSuccess: () => {
      // Invalidate user tournaments list and joined tournaments
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.userLists() });
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.joined() });
    },
  });
};

/**
 * Hook for fetching tournaments that the user has joined (User only)
 */
export const useJoinedTournaments = (enabled = true) => {
  return useQuery({
    queryKey: tournamentsKeys.joined(),
    queryFn: () => tournamentsApi.getJoinedTournaments(),
    enabled,
  });
};

