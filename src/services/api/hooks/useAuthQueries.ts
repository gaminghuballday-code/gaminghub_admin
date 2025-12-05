import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type AuthResponse, type LoginRequest } from '../index';
import { useAppDispatch } from '@store/hooks';
import { setCredentials, setUser, logout as logoutAction } from '@store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@utils/constants';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

/**
 * Hook for user login mutation
 */
export const useLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data: AuthResponse) => {
      // Update Redux store with user and tokens
      dispatch(setCredentials({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      }));
      
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      
      // Navigate to dashboard
      navigate(ROUTES.DASHBOARD);
    },
  });
};

/**
 * Hook for user logout mutation
 */
export const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear Redux store
      dispatch(logoutAction());
      
      // Clear all queries
      queryClient.clear();
      
      // Navigate to login
      navigate(ROUTES.LOGIN);
    },
    onError: () => {
      // Even if API call fails, logout locally
      dispatch(logoutAction());
      queryClient.clear();
      navigate(ROUTES.LOGIN);
    },
  });
};

/**
 * Hook for fetching current user profile
 */
export const useProfile = (enabled = true) => {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    enabled,
    onSuccess: (user) => {
      // Update Redux store with user data
      dispatch(setUser(user));
    },
  });
};

