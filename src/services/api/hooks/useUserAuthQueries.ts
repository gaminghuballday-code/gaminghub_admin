import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type AuthResponse, type LoginRequest, type RegisterRequest, type ForgotPasswordRequest, type ResetPasswordRequest, type UpdateProfileRequest, type VerifyOtpRequest } from '../index';
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
    onSuccess: (response) => {
      // If response has accessToken, it's the old flow (registration completed immediately)
      if ('accessToken' in response) {
        // Update Redux store with user and tokens
        dispatch(setCredentials({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user,
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
      } else {
        // OTP flow - don't navigate or set credentials yet
        // Show message that OTP has been sent
        dispatch(addToast({
          message: response.message || 'OTP sent to your email. Please verify to complete registration.',
          type: 'success',
          duration: 5000,
        }));
      }
    },
  });
};

/**
 * Hook for verify OTP mutation
 */
export const useVerifyOtp = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => authApi.verifyOtp(data),
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
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    // Backend will send the toast message, no need for frontend toaster
  });
};

/**
 * Hook for reset password mutation
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    // Backend will send the toast message, no need for frontend toaster
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

/**
 * Hook for updating user profile mutation
 */
export const useUpdateProfile = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authApi.updateProfile(data),
    onSuccess: (data: AuthResponse['user']) => {
      // Update Redux store with updated user data
      dispatch(setUser(data));
      
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: userAuthKeys.profile() });
      
      // Show success message
      dispatch(addToast({
        message: 'Profile updated successfully!',
        type: 'success',
        duration: 4000,
      }));
    },
  });
};

