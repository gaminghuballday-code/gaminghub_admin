import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Host } from '@services/api';
import { ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import { useProfile, useAllHosts, useCreateHost, useHostStatistics } from '@services/api/hooks';

type HostTab = 'create' | 'all';

export const useHostCreationPageLogic = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [activeTab, setActiveTab] = useState<HostTab>('create');
  
  // Host creation form states
  const [hostEmail, setHostEmail] = useState<string>('');
  const [hostName, setHostName] = useState<string>('');
  const [hostPassword, setHostPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  
  // Selected host for modal
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [showHostModal, setShowHostModal] = useState(false);

  // TanStack Query hooks
  useProfile(isAuthenticated && !user);
  const { data: hostsData, isLoading: hostsLoading, error: hostsQueryError, refetch: refetchHosts } = useAllHosts(isAuthenticated);
  const hosts = hostsData?.hosts || [];
  const pagination = hostsData?.pagination;
  const hostsError = hostsQueryError ? (hostsQueryError as Error).message : null;
  
  const createHostMutation = useCreateHost();
  
  // Host statistics query - only fetch when a host is selected
  const { data: hostStatsData, isLoading: statsLoading } = useHostStatistics(
    selectedHostId ? { hostId: selectedHostId } : undefined,
    !!selectedHostId
  );
  const hostStatistics = hostStatsData?.hosts?.find(h => h.hostId === selectedHostId) || null;

  useEffect(() => {
    // Check authentication from Redux
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
  }, [navigate, isAuthenticated]);

  // Sync sidebar state with CSS variable for dynamic layout

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostEmail.trim() || !hostName.trim() || !hostPassword.trim()) {
      setCreateError('Please fill in all fields');
      return;
    }

    if (hostPassword.length < 6) {
      setCreateError('Password must be at least 6 characters long');
      return;
    }

    setCreateError(null);
    setCreateSuccess(null);

    createHostMutation.mutate(
      {
        email: hostEmail.trim(),
        name: hostName.trim(),
        password: hostPassword,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            setCreateSuccess(`Host account created successfully for ${hostName.trim()}`);
            setHostEmail('');
            setHostName('');
            setHostPassword('');
            refetchHosts();
          } else {
            setCreateError(response.message || 'Failed to create host account');
          }
        },
        onError: (error: any) => {
          console.error('Failed to create host:', error);
          setCreateError(error?.response?.data?.message || error?.message || 'Failed to create host account');
        },
      }
    );
  };

  const handleHostClick = (host: Host) => {
    setSelectedHost(host);
    const hostId = host.hostId || host._id;
    setSelectedHostId(hostId || null);
    setShowHostModal(true);
  };

  const handleCloseModal = () => {
    setShowHostModal(false);
    setSelectedHost(null);
    setSelectedHostId(null);
  };

  // Auto-dismiss success/error messages
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

  return {
    user,
    // Tabs
    activeTab,
    setActiveTab,
    // Host creation form
    hostEmail,
    hostName,
    hostPassword,
    showPassword,
    createLoading: createHostMutation.isPending,
    createError,
    createSuccess,
    setHostEmail,
    setHostName,
    setHostPassword,
    toggleShowPassword,
    handleCreateHost,
    // Hosts list
    hosts,
    hostsLoading,
    hostsError,
    pagination,
    // Host modal
    selectedHost,
    hostStatistics,
    statsLoading,
    showHostModal,
    handleHostClick,
    handleCloseModal,
  };
};

