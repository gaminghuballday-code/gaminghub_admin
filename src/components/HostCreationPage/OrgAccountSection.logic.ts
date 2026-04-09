import { useState, useEffect, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@store/hooks';
import { selectIsAuthenticated, selectAccessToken } from '@store/slices/authSlice';
import type { AdminOrganization, OrgTournamentStatusFilter } from '@services/api/organizations.api';
import {
  useOrganizationsList,
  useCreateOrganization,
  useUploadOrgLogo,
  useOrgTournaments,
  organizationsKeys,
  orgTournamentKeys,
} from '@services/api/hooks/useOrganizationsQueries';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseMutationError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (isRecord(data) && typeof data.message === 'string') {
      return data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
};

export const useOrgAccountSectionLogic = (sectionEnabled: boolean) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector(selectAccessToken);

  const [orgTab, setOrgTab] = useState<'create' | 'all'>('create');
  const [orgName, setOrgName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoFieldKey, setLogoFieldKey] = useState(0);
  const logoPreviewUrlRef = useRef<string | null>(null);

  const [selectedOrg, setSelectedOrg] = useState<AdminOrganization | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [tournamentStatus, setTournamentStatus] = useState<OrgTournamentStatusFilter | ''>('');

  const listEnabled = sectionEnabled && isAuthenticated;
  const {
    data: orgsData,
    isLoading: orgsLoading,
    error: orgsQueryError,
    refetch: refetchOrganizations,
  } = useOrganizationsList(listEnabled);
  const organizations = orgsData?.organizations ?? [];
  const orgsError = orgsQueryError ? (orgsQueryError as Error).message : null;

  const createOrgMutation = useCreateOrganization();
  const uploadLogoMutation = useUploadOrgLogo();

  const statusFilter: OrgTournamentStatusFilter | undefined =
    tournamentStatus === '' ? undefined : tournamentStatus;

  const orgIdForTournaments = selectedOrg?.id;
  const tournamentsEnabled = Boolean(sectionEnabled && showOrgModal && orgIdForTournaments);
  const {
    data: tournamentsData,
    isLoading: tournamentsLoading,
    error: tournamentsQueryError,
  } = useOrgTournaments(orgIdForTournaments, statusFilter, tournamentsEnabled);
  const tournaments = tournamentsData?.tournaments ?? [];
  const tournamentsError = tournamentsQueryError ? (tournamentsQueryError as Error).message : null;

  const revokePreview = useCallback(() => {
    if (logoPreviewUrlRef.current) {
      URL.revokeObjectURL(logoPreviewUrlRef.current);
      logoPreviewUrlRef.current = null;
    }
    setLogoPreviewUrl(null);
  }, []);

  const clearLogoSelection = useCallback(() => {
    revokePreview();
    setLogoFile(null);
    setLogoFieldKey((k) => k + 1);
  }, [revokePreview]);

  const handleLogoFileChange = (file: File | null) => {
    setCreateError(null);
    if (!file) {
      clearLogoSelection();
      return;
    }
    const type = file.type.toLowerCase();
    if (!ALLOWED_LOGO_TYPES.has(type)) {
      setCreateError('Logo must be PNG, JPG, WebP, or GIF');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setCreateError('Logo file must be 2 MB or smaller');
      return;
    }
    revokePreview();
    const url = URL.createObjectURL(file);
    logoPreviewUrlRef.current = url;
    setLogoPreviewUrl(url);
    setLogoFile(file);
  };

  useEffect(() => {
    return () => {
      if (logoPreviewUrlRef.current) {
        URL.revokeObjectURL(logoPreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!sectionEnabled || !isAuthenticated || !accessToken || !orgIdForTournaments || !showOrgModal) {
      return;
    }

    const encodedToken = encodeURIComponent(accessToken);
    const streamUrl = `/api/admin/organizations/${encodeURIComponent(
      orgIdForTournaments
    )}/tournaments/stream?token=${encodedToken}&accessToken=${encodedToken}&authToken=${encodedToken}`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    const invalidateTournaments = () => {
      queryClient.invalidateQueries({
        queryKey: orgTournamentKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: organizationsKeys.list(),
      });
    };

    const onOrgTournament = (event: MessageEvent<string>) => {
      try {
        const payload: unknown = JSON.parse(event.data);
        if (
          isRecord(payload) &&
          typeof payload.orgId === 'string' &&
          payload.orgId === orgIdForTournaments
        ) {
          invalidateTournaments();
        } else {
          invalidateTournaments();
        }
      } catch {
        invalidateTournaments();
      }
    };

    eventSource.addEventListener('org-tournament', onOrgTournament as EventListener);
    eventSource.onerror = () => {
      // EventSource reconnects automatically
    };

    return () => {
      eventSource.removeEventListener('org-tournament', onOrgTournament as EventListener);
      eventSource.close();
    };
  }, [sectionEnabled, isAuthenticated, accessToken, orgIdForTournaments, showOrgModal, queryClient]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = orgName.trim();
    const owner = ownerEmail.trim();

    if (!name || !owner) {
      setCreateError('Organization name and owner email are required');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(owner)) {
      setCreateError('Enter a valid owner email address');
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);

    try {
      let finalLogoUrl = '';
      if (logoFile) {
        finalLogoUrl = await uploadLogoMutation.mutateAsync(logoFile);
      }

      const response = await createOrgMutation.mutateAsync({
        name,
        logoUrl: finalLogoUrl,
        ownerEmail: owner,
      });

      if (response.success === false) {
        setCreateError(response.message || 'Failed to create organization');
        return;
      }

      setCreateSuccess(`Organization "${name}" created successfully`);
      setOrgName('');
      setOwnerEmail('');
      clearLogoSelection();
      refetchOrganizations();
    } catch (error: unknown) {
      setCreateError(parseMutationError(error));
    }
  };

  const handleOrgClick = useCallback((org: AdminOrganization) => {
    setSelectedOrg(org);
    setShowOrgModal(true);
    setTournamentStatus('');
  }, []);

  const handleCloseOrgModal = useCallback(() => {
    setShowOrgModal(false);
    setSelectedOrg(null);
  }, []);

  useEffect(() => {
    if (createSuccess) {
      const t = setTimeout(() => setCreateSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [createSuccess]);

  useEffect(() => {
    if (createError) {
      const t = setTimeout(() => setCreateError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [createError]);

  const createLoading = uploadLogoMutation.isPending || createOrgMutation.isPending;
  const uploadPhase = uploadLogoMutation.isPending;

  return {
    orgTab,
    setOrgTab,
    orgName,
    setOrgName,
    ownerEmail,
    setOwnerEmail,
    logoFieldKey,
    logoPreviewUrl,
    handleLogoFileChange,
    clearLogoSelection,
    createLoading,
    uploadPhase,
    createError,
    createSuccess,
    handleCreateOrganization,
    organizations,
    orgsLoading,
    orgsError,
    selectedOrg,
    showOrgModal,
    tournamentStatus,
    setTournamentStatus,
    tournaments,
    tournamentsLoading,
    tournamentsError,
    handleOrgClick,
    handleCloseOrgModal,
  };
};
