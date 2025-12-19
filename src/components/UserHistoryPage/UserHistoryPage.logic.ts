import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminUser } from '@services/api';
import { ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import { useProfile, useUsers, useTopUpTransactions } from '@services/api/hooks';
import { useSidebarSync } from '@hooks/useSidebarSync';

export const useUserHistoryPageLogic = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // User search states
  const [emailQuery, setEmailQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // TanStack Query hooks
  useProfile(isAuthenticated && !user);
  
  // User search query - only fetch when searchQuery is set
  const { data: searchData, isLoading: searchLoading } = useUsers(
    undefined,
    searchQuery || undefined,
    1,
    10,
    !!searchQuery && searchQuery.trim().length > 0
  );
  const searchResults = searchData?.users || [];
  
  // Transactions query - only fetch when user is selected
  const selectedUserId = selectedUser?.userId || selectedUser?._id;
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsQueryError } = useTopUpTransactions(
    selectedUserId ? { userId: selectedUserId, limit: 100 } : undefined,
    !!selectedUserId
  );
  const transactions = transactionsData?.transactions || [];
  const totalTransactions = transactionsData?.total || transactions.length;
  const transactionsError = transactionsQueryError ? (transactionsQueryError as Error).message : null;

  useEffect(() => {
    // Check authentication from Redux
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
  }, [navigate, isAuthenticated]);

  // Sync sidebar state with CSS variable for dynamic layout
  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Handle email input change - just update the query, no debounce
  const handleEmailSearch = (query: string) => {
    setEmailQuery(query);
    // Clear selected user if input is cleared
    if (!query.trim()) {
      setSelectedUser(null);
      setSearchQuery('');
    }
  };

  // Auto-select user when search results are available
  useEffect(() => {
    if (searchResults.length > 0 && searchQuery.trim()) {
      // Auto-select the first matching user
      const firstUser = searchResults[0];
      setSelectedUser(firstUser);
      setEmailQuery(firstUser.email);
      setSearchQuery(''); // Clear search query after selection
    } else if (searchResults.length === 0 && searchQuery.trim() && !searchLoading) {
      // No results found - clear selected user
      setSelectedUser(null);
    }
  }, [searchResults, searchQuery, searchLoading]);

  const handleSearchByEmail = () => {
    if (!emailQuery.trim()) {
      return;
    }
    // Trigger search by setting searchQuery - this will auto-select user when results come
    setSearchQuery(emailQuery.trim());
  };

  return {
    user,
    sidebarOpen,
    toggleSidebar,
    emailQuery,
    selectedUser,
    searchLoading,
    transactions,
    transactionsLoading,
    transactionsError,
    totalTransactions,
    handleEmailSearch,
    handleSearchByEmail,
  };
};

