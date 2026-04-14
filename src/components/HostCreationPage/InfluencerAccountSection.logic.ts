import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { useAppSelector } from '@store/hooks';
import { selectIsAuthenticated } from '@store/slices/authSlice';
import { useUsers, useInviteInfluencer } from '@services/api/hooks';

type InfluencerTab = 'invite' | 'all';
const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9_-]{8,16}$/;

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

export const useInfluencerAccountSectionLogic = (
  sectionEnabled: boolean,
  privilegedAccountActions: boolean
) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [influencerTab, setInfluencerTab] = useState<InfluencerTab>('invite');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteReferralCode, setInviteReferralCode] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [listPage, setListPage] = useState(1);
  const pageLimit = 10;
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const listEnabled =
    sectionEnabled && isAuthenticated && influencerTab === 'all';

  const {
    data: usersData,
    isLoading: influencersLoading,
    error: influencersQueryError,
  } = useUsers(
    'influencer',
    appliedSearch || undefined,
    listPage,
    pageLimit,
    listEnabled
  );

  const influencers = usersData?.users ?? [];
  const pagination = usersData?.pagination;
  const influencersError = influencersQueryError
    ? (influencersQueryError as Error).message
    : null;

  const inviteMutation = useInviteInfluencer();
  const trimmedReferralCode = inviteReferralCode.trim();
  const isReferralCodeInvalid =
    trimmedReferralCode.length > 0 && !REFERRAL_CODE_PATTERN.test(trimmedReferralCode);

  useEffect(() => {
    if (!privilegedAccountActions && influencerTab === 'invite') {
      setInfluencerTab('all');
    }
  }, [privilegedAccountActions, influencerTab]);

  useEffect(() => {
    if (createSuccess) {
      const timer = setTimeout(() => {
        setCreateSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [createSuccess]);

  useEffect(() => {
    if (createError) {
      const timer = setTimeout(() => {
        setCreateError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [createError]);

  const handleInviteInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setCreateError('Email and name are required');
      return;
    }
    if (isReferralCodeInvalid) {
      setCreateError(
        'Referral code must be 8-16 characters and only use letters, numbers, "_" or "-".'
      );
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);

    try {
      const response = await inviteMutation.mutateAsync({
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        ...(trimmedReferralCode ? { referralCode: trimmedReferralCode } : {}),
      });
      if (response.success) {
        setCreateSuccess(
          response.message?.trim() ||
            `Invite sent to ${inviteEmail.trim()}. They can complete signup with the OTP sent to their email.`
        );
        setInviteEmail('');
        setInviteName('');
        setInviteReferralCode('');
      } else {
        setCreateError(response.message || 'Failed to send invite');
      }
    } catch (err) {
      setCreateError(parseMutationError(err));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
    setListPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (!pagination) return;
    if (nextPage >= 1 && nextPage <= pagination.totalPages) {
      setListPage(nextPage);
    }
  };

  return {
    influencerTab,
    setInfluencerTab,
    inviteEmail,
    setInviteEmail,
    inviteName,
    setInviteName,
    inviteReferralCode,
    setInviteReferralCode,
    isReferralCodeInvalid,
    createLoading: inviteMutation.isPending,
    createError,
    createSuccess,
    handleInviteInfluencer,
    influencers,
    influencersLoading,
    influencersError,
    pagination,
    listPage,
    searchInput,
    setSearchInput,
    appliedSearch,
    handleSearchSubmit,
    handlePageChange,
  };
};
