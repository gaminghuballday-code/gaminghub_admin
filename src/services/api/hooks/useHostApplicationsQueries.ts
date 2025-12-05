import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hostApplicationsApi,
  type GetHostStatisticsParams,
  type CreateHostRequest,
} from '../index';

// Query keys
export const hostApplicationsKeys = {
  all: ['hostApplications'] as const,
  applications: (tournamentId: string) =>
    [...hostApplicationsKeys.all, 'applications', tournamentId] as const,
  hosts: (tournamentId: string) =>
    [...hostApplicationsKeys.all, 'hosts', tournamentId] as const,
  statistics: (params?: GetHostStatisticsParams) =>
    [...hostApplicationsKeys.all, 'statistics', params] as const,
  allHosts: () => [...hostApplicationsKeys.all, 'all'] as const,
};

/**
 * Hook for fetching host applications
 */
export const useHostApplications = (tournamentId: string, enabled = true) => {
  return useQuery({
    queryKey: hostApplicationsKeys.applications(tournamentId),
    queryFn: () => hostApplicationsApi.getHostApplications(tournamentId),
    enabled: enabled && !!tournamentId,
  });
};

/**
 * Hook for approving host application mutation
 */
export const useApproveApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) => hostApplicationsApi.approveApplication(applicationId),
    onSuccess: (_, applicationId) => {
      // Invalidate applications list - we need tournamentId, so invalidate all
      queryClient.invalidateQueries({ queryKey: hostApplicationsKeys.all });
    },
  });
};

/**
 * Hook for rejecting host application mutation
 */
export const useRejectApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) => hostApplicationsApi.rejectApplication(applicationId),
    onSuccess: () => {
      // Invalidate applications list
      queryClient.invalidateQueries({ queryKey: hostApplicationsKeys.all });
    },
  });
};

/**
 * Hook for fetching all hosts with assignments
 */
export const useAllHostsWithAssignments = (tournamentId: string, enabled = true) => {
  return useQuery({
    queryKey: hostApplicationsKeys.hosts(tournamentId),
    queryFn: () => hostApplicationsApi.getAllHostsWithAssignments(tournamentId),
    enabled: enabled && !!tournamentId,
  });
};

/**
 * Hook for assigning host mutation
 */
export const useAssignHost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { tournamentId: string; hostId: string }) =>
      hostApplicationsApi.assignHost(data),
    onSuccess: (_, variables) => {
      // Invalidate hosts list for this tournament
      queryClient.invalidateQueries({
        queryKey: hostApplicationsKeys.hosts(variables.tournamentId),
      });
      queryClient.invalidateQueries({ queryKey: hostApplicationsKeys.all });
    },
  });
};

/**
 * Hook for fetching host statistics
 */
export const useHostStatistics = (params?: GetHostStatisticsParams, enabled = true) => {
  return useQuery({
    queryKey: hostApplicationsKeys.statistics(params),
    queryFn: () => hostApplicationsApi.getHostStatistics(params),
    enabled,
  });
};

/**
 * Hook for creating host mutation
 */
export const useCreateHost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHostRequest) => hostApplicationsApi.createHost(data),
    onSuccess: () => {
      // Invalidate all hosts list
      queryClient.invalidateQueries({ queryKey: hostApplicationsKeys.allHosts() });
    },
  });
};

/**
 * Hook for fetching all hosts
 */
export const useAllHosts = (enabled = true) => {
  return useQuery({
    queryKey: hostApplicationsKeys.allHosts(),
    queryFn: () => hostApplicationsApi.getAllHosts(),
    enabled,
  });
};

