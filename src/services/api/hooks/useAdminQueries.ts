import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../admin.api';
import { useAppDispatch } from '@store/hooks';
import { logout as logoutAction, setUser } from '@store/slices/authSlice';
import type { AuthResponse, UpdateProfileRequest, ChangePasswordRequest } from '@services/types/api.types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@utils/constants';

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  analytics: (period: string) => [...adminKeys.all, 'analytics', period] as const,
  profile: () => [...adminKeys.all, 'profile'] as const,
  devices: (page: number, limit: number) => [...adminKeys.all, 'devices', page, limit] as const,
};

/**
 * Hook for fetching platform statistics
 */
export const usePlatformStats = (enabled = true) => {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => adminApi.getPlatformStats(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/**
 * Hook for fetching analytical reports
 */
export const useAnalytics = (period: 'daily' | 'weekly' | 'monthly' = 'daily', enabled = true) => {
  return useQuery({
    queryKey: adminKeys.analytics(period),
    queryFn: () => adminApi.getAnalytics(period),
    enabled,
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Hook for fetching current admin profile
 */
export const useAdminProfile = (enabled = true) => {
  const dispatch = useAppDispatch();
  const query = useQuery({
    queryKey: adminKeys.profile(),
    queryFn: () => adminApi.getProfile(),
    enabled,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setUser(query.data));
    }
  }, [query.data, dispatch]);

  return query;
};

/**
 * Hook for updating admin profile
 */
export const useAdminUpdateProfile = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => adminApi.updateProfile(data),
    onSuccess: (data: AuthResponse['user']) => {
      dispatch(setUser(data));
      queryClient.invalidateQueries({ queryKey: adminKeys.profile() });
    },
  });
};

/**
 * Hook for changing admin password
 */
export const useAdminChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => adminApi.changePassword(data),
  });
};

/**
 * Hook for admin logout from current device
 */
export const useAdminLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminApi.logout(),
    onSuccess: () => {
      dispatch(logoutAction());
      queryClient.clear();
      navigate(ROUTES.LOGIN);
    },
    onError: () => {
      dispatch(logoutAction());
      queryClient.clear();
      navigate(ROUTES.LOGIN);
    },
  });
};

/**
 * Hook for admin logout from all devices
 */
export const useAdminLogoutAll = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminApi.logoutAll(),
    onSuccess: () => {
      dispatch(logoutAction());
      queryClient.clear();
      navigate(ROUTES.LOGIN);
    },
    onError: () => {
      dispatch(logoutAction());
      queryClient.clear();
      navigate(ROUTES.LOGIN);
    },
  });
};

/**
 * Hook for fetching admin device history
 */
export const useAdminDevices = (page: number, limit: number, enabled = true) => {
  return useQuery({
    queryKey: adminKeys.devices(page, limit),
    queryFn: () => adminApi.getDevices(page, limit),
    enabled,
    staleTime: 60 * 1000,
  });
};
