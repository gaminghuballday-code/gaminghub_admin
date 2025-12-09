import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type AuthResponse, type LoginRequest, type RegisterRequest, type ForgotPasswordRequest } from '../index';
import { useAppDispatch } from '@store/hooks';
import { setCredentials, setUser, logout as logoutAction } from '@store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { USER_ROUTES } from '@utils/constants';
import { addToast } from '@store/slices/toastSlice';

// Query keys
export const userAuthKeys = {
  all: ['userAuth'] as const,
  profile: () => [...userAuthKeys.all, 'profile'] as const,
};

/**
 * Hook for user login mutation (for user app)
 */
export const useUserLogin = () => {
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
      queryClient.invalidateQueries({ queryKey: userAuthKeys.profile() });
      
      // Navigate to user home (not dashboard)
      navigate(USER_ROUTES.HOME);
    },
  });
};

/**
 * Hook for user register mutation
 */
export const useUserRegister = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data: AuthResponse) => {
      // Update Redux store with user and tokens
      dispatch(setCredentials({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      }));
      
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: userAuthKeys.profile() });
      
      // Show success message
      dispatch(addToast({
        message: 'Account created successfully!',
        type: 'success',
        duration: 4000,
      }));
      
      // Navigate to user home
      navigate(USER_ROUTES.HOME);
    },
  });
};

/**
 * Hook for forgot password mutation
 */
export const useForgotPassword = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    onSuccess: () => {
      dispatch(addToast({
        message: 'Password reset email sent! Please check your inbox.',
        type: 'success',
        duration: 6000,
      }));
    },
  });
};

/**
 * Hook for user logout mutation
 */
export const useUserLogout = () => {
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
      navigate(USER_ROUTES.LOGIN);
    },
    onError: () => {
      // Even if API call fails, logout locally
      dispatch(logoutAction());
      queryClient.clear();
      navigate(USER_ROUTES.LOGIN);
    },
  });
};

/**
 * Hook for Google login mutation
 */
export const useGoogleLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idToken, name }: { idToken: string; name?: string }) => 
      authApi.googleLogin(idToken, name),
    onSuccess: (data: AuthResponse) => {
      // Update Redux store with user and tokens
      dispatch(setCredentials({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      }));
      
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: userAuthKeys.profile() });
      
      // Show success message
      dispatch(addToast({
        message: 'Successfully signed in with Google!',
        type: 'success',
        duration: 4000,
      }));
      
      // Navigate to user home
      navigate(USER_ROUTES.HOME);
    },
  });
};

/**
 * Hook for fetching current user profile
 */
export const useUserProfile = (enabled = true) => {
  const dispatch = useAppDispatch();

  const query = useQuery({
    queryKey: userAuthKeys.profile(),
    queryFn: () => authApi.getProfile(),
    enabled,
  });

  // Update Redux store when data is available
  useEffect(() => {
    if (query.data) {
      dispatch(setUser(query.data));
    }
  }, [query.data, dispatch]);

  return query;
};

