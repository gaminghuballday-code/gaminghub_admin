import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  organizationsApi,
  type CreateOrganizationRequest,
  type OrgTournamentStatusFilter,
} from '../organizations.api';

export const organizationsKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationsKeys.all, 'list'] as const,
};

export const orgTournamentKeys = {
  all: ['orgTournaments'] as const,
  list: (orgId: string, status?: OrgTournamentStatusFilter) =>
    [...orgTournamentKeys.all, 'list', orgId, status ?? 'all'] as const,
};

export const useOrganizationsList = (enabled = true) => {
  return useQuery({
    queryKey: organizationsKeys.list(),
    queryFn: () => organizationsApi.getOrganizations(),
    enabled,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationRequest) => organizationsApi.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
    },
  });
};

export const useUploadOrgLogo = () => {
  return useMutation({
    mutationFn: (file: File) => organizationsApi.uploadOrgLogoImage(file),
  });
};

export const useOrgTournaments = (
  orgId: string | undefined,
  status: OrgTournamentStatusFilter | undefined,
  enabled = true
) => {
  return useQuery({
    queryKey: orgTournamentKeys.list(orgId ?? '', status),
    queryFn: () =>
      organizationsApi.getOrgTournaments(orgId as string, status),
    enabled: enabled && Boolean(orgId),
  });
};
