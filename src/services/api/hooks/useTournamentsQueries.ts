import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  tournamentsApi,
  hostApi,
  type GetTournamentsParams,
  type UpdateTournamentRequest,
  type UpdateRoomRequest,
  type JoinTournamentRequest,
  type ApplyRoomUpdateRequest,
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
  hostLists: () => [...tournamentsKeys.all, 'host', 'list'] as const,
  hostAvailable: () => [...tournamentsKeys.all, 'host', 'available'] as const,
  hostApplications: () => [...tournamentsKeys.all, 'host', 'applications'] as const,
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

/**
 * Hook for fetching tournaments assigned to the current host (Host only)
 */
export const useHostTournaments = (enabled = true) => {
  return useQuery({
    queryKey: tournamentsKeys.hostLists(),
    queryFn: () => hostApi.getHostTournaments(),
    enabled,
  });
};

/**
 * Hook for applying to host a tournament (Host only)
 */
export const useApplyForHostTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tournamentId: string) => hostApi.applyForHostTournament(tournamentId),
    onSuccess: () => {
      // Refresh user and host tournament lists
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.userLists() });
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.hostLists() });
      // Invalidate and refetch available tournaments to show updated application status
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.hostAvailable() });
      // Also invalidate host applications to refresh the list
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.hostApplications() });
    },
  });
};

/**
 * Hook for updating room as host (Host only)
 */
export const useUpdateHostRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tournamentId, data }: { tournamentId: string; data: Omit<UpdateRoomRequest, 'tournamentId'> }) =>
      hostApi.updateHostRoom(tournamentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.hostLists() });
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.hostAvailable() });
    },
  });
};

/**
 * Hook for fetching current host's own applications (Host only)
 */
export const useHostApplicationsForUser = (enabled = true) => {
  return useQuery({
    queryKey: tournamentsKeys.hostApplications(),
    queryFn: () => hostApi.getOwnApplications(),
    enabled,
  });
};

/**
 * Hook for fetching available tournaments with host application status (Host only)
 * @param status - Optional status filter (upcoming, live, completed, cancelled)
 */
export const useAvailableHostTournaments = (status?: string, enabled = true) => {
  return useQuery({
    queryKey: [...tournamentsKeys.hostAvailable(), status],
    queryFn: () => hostApi.getAvailableTournaments(status),
    enabled,
  });
};

/**
 * Hook for applying room update permission (Host only)
 */
export const useApplyRoomUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApplyRoomUpdateRequest) => tournamentsApi.applyRoomUpdate(data),
    onSuccess: () => {
      // Invalidate joined tournaments to refresh permission status
      queryClient.invalidateQueries({ queryKey: tournamentsKeys.joined() });
    },
  });
};

