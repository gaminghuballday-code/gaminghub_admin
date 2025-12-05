import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminUser } from '@services/api';
import { ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import {
  useProfile,
  useUsers,
  useBlockUsers,
  useUnblockUsers,
  useHostStatistics,
} from '@services/api/hooks';

export const useDashboardLogic = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit] = useState<number>(10);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'host' | 'user'>('all');
  const [userQuery, setUserQuery] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Host Statistics states
  const [activeTab, setActiveTab] = useState<'users' | 'hostStats'>('users');
  const [hostStatsFilters, setHostStatsFilters] = useState<{
    date?: string;
    fromDate?: string;
    toDate?: string;
    hostId?: string;
  }>({});

  // TanStack Query hooks
  const { data: profileData } = useProfile(isAuthenticated && !user);
  
  // Track if we're in search mode
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // Users query - fetch when authenticated
  const shouldFetchUsers = isAuthenticated;
  const roleForQuery = roleFilter === 'all' ? undefined : roleFilter;
  const queryForHook = isSearchMode ? (userQuery.trim() || undefined) : undefined;
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

  // Host Statistics query
  const shouldFetchHostStats = activeTab === 'hostStats' && isAuthenticated;
  const { 
    data: hostStatsData, 
    isLoading: hostStatsLoading, 
    error: hostStatsQueryError,
    refetch: refetchHostStats 
  } = useHostStatistics(hostStatsFilters, shouldFetchHostStats);
  
  const hostStatistics = hostStatsData?.hosts || [];
  const totalHosts = hostStatsData?.totalHosts || 0;
  const totalLobbies = hostStatsData?.totalLobbies || 0;
  const hostStatsError = hostStatsQueryError ? (hostStatsQueryError as Error).message : null;

  useEffect(() => {
    // Check authentication from Redux
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    // Profile loading is handled by useProfile hook
  }, [navigate, isAuthenticated]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleRoleFilterChange = (filter: 'all' | 'admin' | 'host' | 'user') => {
    setRoleFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
    setSelectedUserIds(new Set()); // Clear selection when filter changes
    setIsSearchMode(false); // Reset search mode when filter changes
  };

  const handleQueryUsers = async () => {
    if (!isAuthenticated) return;

    setIsSearchMode(true);
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
      console.log('Email copied:', email);
    } catch (error) {
      console.error('Failed to copy email:', error);
      setUsersError('Failed to copy email');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      setSelectedUserIds(new Set()); // Clear selection when page changes
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
  const handleHostStatsFilterChange = (filterType: 'date' | 'fromDate' | 'toDate' | 'hostId', value: string) => {
    setHostStatsFilters((prev) => ({
      ...prev,
      [filterType]: value || undefined,
    }));
  };

  const handleClearHostStatsFilters = () => {
    setHostStatsFilters({});
  };

  const handleSearchHostStats = () => {
    refetchHostStats();
  };

  return {
    user,
    sidebarOpen,
    toggleSidebar,
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
    handleUserCardClick,
    handleCopyEmail,
    currentPage,
    handlePageChange,
    handlePreviousPage,
    handleNextPage,
    // Host Statistics
    activeTab,
    setActiveTab,
    hostStatistics,
    hostStatsLoading,
    hostStatsError,
    hostStatsFilters,
    totalHosts,
    totalLobbies,
    handleHostStatsFilterChange,
    handleClearHostStatsFilters,
    handleSearchHostStats,
  };
};

