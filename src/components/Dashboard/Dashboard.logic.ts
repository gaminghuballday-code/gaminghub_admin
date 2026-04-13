import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AdminUser,
  GetHostStatisticsParams,
  GetInfluencerStatisticsParams,
  GetUserReferralsParams,
} from '@services/api';
import { ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectAccessToken, selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import {
  useUsers,
  useBlockUsers,
  useUnblockUsers,
  useHostStatistics,
  useInfluencerStatistics,
  useUserReferralsStats,
  usePlatformStats,
  adminKeys,
} from '@services/api/hooks';
import { normalizePlatformStats } from '@services/api/admin.api';
import type { PlatformStats } from '@services/types/api.types';

export const useDashboardLogic = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector(selectAccessToken);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit] = useState<number>(10);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'host' | 'user' | 'influencer'>('all');
  const [userQuery, setUserQuery] = useState<string>('');
  const [appliedUserQuery, setAppliedUserQuery] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Host Statistics states
  const [activeTab, setActiveTab] = useState<
    'users' | 'hostStats' | 'influencerStats' | 'orgStats' | 'subAdminStats'
  >('users');
  
  const [hostStatsFilters, setHostStatsFilters] = useState<{
    fromDate?: string;
    toDate?: string;
    hostEmail?: string;
  }>({});
  const [appliedHostStatsFilters, setAppliedHostStatsFilters] = useState<{
    fromDate?: string;
    toDate?: string;
    hostEmail?: string;
  }>({});
  const [hostStatsCurrentPage, setHostStatsCurrentPage] = useState<number>(1);
  const hostStatsPageLimit = 10;

  const [influencerStatsEmail, setInfluencerStatsEmail] = useState('');
  const [appliedInfluencerStatsEmail, setAppliedInfluencerStatsEmail] = useState('');
  
  // Build API params from filters using useMemo
  const hostStatsParams = useMemo((): GetHostStatisticsParams | undefined => {
    if (
      !appliedHostStatsFilters.hostEmail &&
      !appliedHostStatsFilters.fromDate &&
      !appliedHostStatsFilters.toDate
    ) {
      return undefined;
    }

    const params: GetHostStatisticsParams = {};

    const hasHostEmail = appliedHostStatsFilters.hostEmail?.trim();
    const hasFromDate = appliedHostStatsFilters.fromDate;
    const hasToDate = appliedHostStatsFilters.toDate;
    const hasAnyDate = hasFromDate || hasToDate;

    // Special case: If ONLY host email (no dates), don't send date
    if (hasHostEmail && !hasAnyDate) {
      params.hostEmail = appliedHostStatsFilters.hostEmail?.trim();
      return params;
    }

    // Handle dates
    if (hasFromDate && hasToDate) {
      // Both dates provided - date range
      params.fromDate = appliedHostStatsFilters.fromDate;
      params.toDate = appliedHostStatsFilters.toDate;
    } else if (hasFromDate && !hasToDate) {
      // Only fromDate - treat as single date
      params.date = appliedHostStatsFilters.fromDate;
    } else if (!hasFromDate && hasToDate) {
      // Only toDate - treat as single date
      params.date = appliedHostStatsFilters.toDate;
    }

    // Add host email if provided (with dates)
    if (hasHostEmail) {
      params.hostEmail = appliedHostStatsFilters.hostEmail?.trim();
    }

    return params;
  }, [appliedHostStatsFilters]);

  const influencerStatsParams = useMemo((): GetInfluencerStatisticsParams | undefined => {
    const email = appliedInfluencerStatsEmail.trim();
    if (!email) {
      return undefined;
    }
    return { email };
  }, [appliedInfluencerStatsEmail]);

  // TanStack Query hooks
  // const { data: profileData } = useProfile(isAuthenticated && !user);
  
  // Track if we're in search mode
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // Users query - fetch when authenticated
  const shouldFetchUsers = isAuthenticated;
  const roleForQuery = roleFilter === 'all' ? undefined : roleFilter;
  const queryForHook = isSearchMode ? (appliedUserQuery || undefined) : undefined;
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    error: usersQueryError,
    refetch: refetchUsers 
  } = useUsers(roleForQuery, queryForHook, currentPage, pageLimit, shouldFetchUsers);
  
  const users = usersData?.users || [];
  const pagination = usersData?.pagination ? {
    page: usersData.pagination.page,
    total: usersData.pagination.total,
    totalPages: usersData.pagination.totalPages,
  } : null;
  const usersError = usersQueryError ? (usersQueryError as Error).message : null;

  const blockUsersMutation = useBlockUsers();
  const unblockUsersMutation = useUnblockUsers();

  // Host Statistics query - fetch default data on tab open, apply filters only on explicit search
  const shouldFetchHostStats = activeTab === 'hostStats' && isAuthenticated;
  const { 
    data: hostStatsData, 
    isLoading: hostStatsLoading, 
    error: hostStatsQueryError
  } = useHostStatistics(hostStatsParams, shouldFetchHostStats);
  
  const hostStatistics = hostStatsData?.hosts || [];
  const hostStatsTotalPages = Math.max(1, Math.ceil(hostStatistics.length / hostStatsPageLimit));
  const paginatedHostStatistics = useMemo(() => {
    const startIndex = (hostStatsCurrentPage - 1) * hostStatsPageLimit;
    return hostStatistics.slice(startIndex, startIndex + hostStatsPageLimit);
  }, [hostStatistics, hostStatsCurrentPage]);
  const totalHosts = hostStatsData?.totalHosts || 0;
  const totalLobbies = hostStatsData?.totalLobbies || 0;
  const totalHostFeeEarned = hostStatsData?.totalHostFeeEarned || 0;
  const allHostsLifetimeHostFeeEarned = hostStatsData?.allHostsLifetimeHostFeeEarned || 0;
  const hostStatsError = hostStatsQueryError ? (hostStatsQueryError as Error).message : null;

  const shouldFetchInfluencerStats = activeTab === 'influencerStats' && isAuthenticated;
  const {
    data: influencerStatsData,
    isLoading: influencerStatsLoading,
    error: influencerStatsQueryError,
  } = useInfluencerStatistics(influencerStatsParams, shouldFetchInfluencerStats);
  const influencerStatsError = influencerStatsQueryError
    ? (influencerStatsQueryError as Error).message
    : null;

  const selectedUserReferralsParams = useMemo((): GetUserReferralsParams | undefined => {
    if (!selectedUser) {
      return undefined;
    }

    const selectedUserId = (selectedUser.userId || selectedUser._id || '').trim();
    if (selectedUserId) {
      return { userId: selectedUserId, limit: 100, skip: 0 };
    }

    const selectedUserEmail = selectedUser.email?.trim();
    if (selectedUserEmail) {
      return { email: selectedUserEmail, limit: 100, skip: 0 };
    }

    return undefined;
  }, [selectedUser]);

  const {
    data: selectedUserReferralsStats,
    isLoading: selectedUserReferralsLoading,
    error: selectedUserReferralsQueryError,
  } = useUserReferralsStats(
    selectedUserReferralsParams,
    isAuthenticated && activeTab === 'users' && Boolean(selectedUser)
  );
  const selectedUserReferralsError = selectedUserReferralsQueryError
    ? (selectedUserReferralsQueryError as Error).message
    : null;

  // Platform Statistics query
  const {
    data: platformStats,
    isLoading: platformStatsLoading,
    error: platformStatsError
  } = usePlatformStats(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const encodedToken = encodeURIComponent(accessToken);
    // Backends differ on query key names for SSE auth. Send common aliases.
    const streamUrl = `/api/admin/dashboard/stats/stream?token=${encodedToken}&accessToken=${encodedToken}&authToken=${encodedToken}`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    const updateStatsCache = (stats: PlatformStats) => {
      queryClient.setQueryData(adminKeys.stats(), stats);
    };

    const processPayload = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') {
        return;
      }

      if ('data' in payload && typeof payload.data === 'object' && payload.data !== null) {
        const normalizedStats = normalizePlatformStats(payload.data);
        if (normalizedStats) {
          updateStatsCache(normalizedStats);
          return;
        }
      }

      const normalizedPayload = normalizePlatformStats(payload);
      if (normalizedPayload) {
        updateStatsCache(normalizedPayload);
      }
    };

    const handleStreamMessage = (event: MessageEvent<string>) => {
      try {
        const payload: unknown = JSON.parse(event.data);
        processPayload(payload);
      } catch {
        // Ignore malformed SSE frames; do not refetch (would fight the live stream and can flash zeros).
      }
    };

    eventSource.addEventListener('dashboard-stats', handleStreamMessage as EventListener);
    eventSource.addEventListener('stats-updated', handleStreamMessage as EventListener);
    eventSource.onmessage = handleStreamMessage;
    eventSource.onerror = () => {
      // Let EventSource reconnect automatically.
    };

    return () => {
      eventSource.removeEventListener('dashboard-stats', handleStreamMessage as EventListener);
      eventSource.removeEventListener('stats-updated', handleStreamMessage as EventListener);
      eventSource.close();
    };
  }, [accessToken, isAuthenticated, queryClient]);

  useEffect(() => {
    // Check authentication from Redux
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    // Profile loading is handled by useProfile hook
  }, [navigate, isAuthenticated]);


  const handleRoleFilterChange = (filter: 'all' | 'admin' | 'host' | 'user' | 'influencer') => {
    setRoleFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
    setSelectedUserIds(new Set()); // Clear selection when filter changes
    setIsSearchMode(false); // Reset search mode when filter changes
    setAppliedUserQuery('');
  };

  const handleQueryUsers = async () => {
    if (!isAuthenticated) return;

    setIsSearchMode(true);
    setAppliedUserQuery(userQuery.trim());
    setCurrentPage(1); // Reset to first page when searching
    // The query will automatically refetch when isSearchMode changes
  };

  const handleQueryChange = (query: string) => {
    setUserQuery(query);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    // Exclude admin users from selection
    const allUserIds = users
      .filter((u) => u.role?.toLowerCase() !== 'admin')
      .map((u) => u.userId || u._id)
      .filter((id): id is string => Boolean(id));

    if (selectedUserIds.size === allUserIds.length && allUserIds.length > 0) {
      // Deselect all
      setSelectedUserIds(new Set());
    } else {
      // Select all (excluding admins)
      setSelectedUserIds(new Set(allUserIds));
    }
  };

  const handleBlockUsers = async () => {
    if (selectedUserIds.size === 0) return;

    // Filter out admin users from the list to block
    const userIds = Array.from(selectedUserIds).filter((id) => {
      const user = users.find((u) => (u.userId || u._id) === id);
      return user && user.role?.toLowerCase() !== 'admin';
    });

    if (userIds.length === 0) {
      return;
    }

    blockUsersMutation.mutate(
      { userIds },
      {
        onSuccess: () => {
          setSelectedUserIds(new Set());
          refetchUsers();
        },
        onError: (error: any) => {
          console.error('Failed to block users:', error);
        },
      }
    );
  };

  const handleUnblockUsers = async () => {
    if (selectedUserIds.size === 0) return;

    const userIds = Array.from(selectedUserIds);
    unblockUsersMutation.mutate(
      { userIds },
      {
        onSuccess: () => {
          setSelectedUserIds(new Set());
          refetchUsers();
        },
        onError: (error: any) => {
          console.error('Failed to unblock users:', error);
        },
      }
    );
  };

  const handleBlockSingleUser = async (userId: string) => {
    // Prevent blocking admin users
    const user = users.find((u) => (u.userId || u._id) === userId);
    if (user && user.role?.toLowerCase() === 'admin') {
      return;
    }

    setProcessingUserId(userId);
    blockUsersMutation.mutate(
      { userIds: [userId] },
      {
        onSuccess: () => {
          setProcessingUserId(null);
          refetchUsers();
        },
        onError: (error: any) => {
          console.error('Failed to block user:', error);
          setProcessingUserId(null);
        },
      }
    );
  };

  const handleUnblockSingleUser = async (userId: string) => {
    setProcessingUserId(userId);
    unblockUsersMutation.mutate(
      { userIds: [userId] },
      {
        onSuccess: () => {
          setProcessingUserId(null);
          refetchUsers();
        },
        onError: (error: any) => {
          console.error('Failed to unblock user:', error);
          setProcessingUserId(null);
        },
      }
    );
  };

  const isAllSelected = users.length > 0 && selectedUserIds.size === users.length;

  const handleUserCardClick = (user: AdminUser | null) => {
    setSelectedUser(user);
  };

  const handleCopyEmail = async (email: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      await navigator.clipboard.writeText(email);
      // You could add a toast notification here if needed
    } catch (error) {
      console.error('Failed to copy email:', error);
      // setUsersError('Failed to copy email');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      setSelectedUserIds(new Set()); // Clear selection when page changes
      const contentContainer = document.querySelector('.admin-content');
      if (contentContainer instanceof HTMLElement) {
        contentContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Query will automatically refetch when currentPage changes
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Host Statistics functions
  const handleHostStatsFilterChange = (filterType: 'fromDate' | 'toDate' | 'hostEmail', value: string) => {
    setHostStatsFilters((prev) => ({
      ...prev,
      [filterType]: value || undefined,
    }));
  };

  const handleClearHostStatsFilters = () => {
    setHostStatsFilters({});
    setAppliedHostStatsFilters({});
    setHostStatsCurrentPage(1);
  };

  const handleSearchHostStats = () => {
    setAppliedHostStatsFilters({
      fromDate: hostStatsFilters.fromDate,
      toDate: hostStatsFilters.toDate,
      hostEmail: hostStatsFilters.hostEmail?.trim() || undefined,
    });
    setHostStatsCurrentPage(1);
  };

  const handleHostStatsPageChange = (page: number) => {
    if (page < 1 || page > hostStatsTotalPages) return;
    setHostStatsCurrentPage(page);
  };

  const handleInfluencerStatsEmailChange = (value: string) => {
    setInfluencerStatsEmail(value);
  };

  const handleSearchInfluencerStats = () => {
    setAppliedInfluencerStatsEmail(influencerStatsEmail.trim());
  };

  const handleClearInfluencerStatsSearch = () => {
    setInfluencerStatsEmail('');
    setAppliedInfluencerStatsEmail('');
  };

  return {
    user,
    users: users,
    usersLoading,
    usersError,
    pagination,
    roleFilter,
    handleRoleFilterChange,
    userQuery,
    handleQueryChange,
    handleQueryUsers,
    selectedUserIds,
    handleUserSelect,
    handleSelectAll,
    isAllSelected,
    handleBlockUsers,
    handleUnblockUsers,
    handleBlockSingleUser,
    handleUnblockSingleUser,
    isBlocking: blockUsersMutation.isPending,
    isUnblocking: unblockUsersMutation.isPending,
    processingUserId,
    selectedUser,
    selectedUserReferralsStats,
    selectedUserReferralsLoading,
    selectedUserReferralsError,
    handleUserCardClick,
    handleCopyEmail,
    currentPage,
    usersPageLimit: pageLimit,
    handlePageChange,
    handlePreviousPage,
    handleNextPage,
    // Host Statistics
    activeTab,
    setActiveTab,
    hostStatistics: paginatedHostStatistics,
    hostStatsLoading,
    hostStatsError,
    hostStatsFilters,
    totalHosts,
    totalLobbies,
    totalHostFeeEarned,
    allHostsLifetimeHostFeeEarned,
    hostStatsCurrentPage,
    hostStatsTotalPages,
    handleHostStatsFilterChange,
    handleClearHostStatsFilters,
    handleSearchHostStats,
    handleHostStatsPageChange,
    // Influencer statistics (static API)
    influencerStatsData,
    influencerStatsLoading,
    influencerStatsError,
    influencerStatsEmail,
    appliedInfluencerStatsEmail,
    handleInfluencerStatsEmailChange,
    handleSearchInfluencerStats,
    handleClearInfluencerStatsSearch,
    // Platform Statistics
    platformStats,
    platformStatsLoading,
    platformStatsError,
  };
};

