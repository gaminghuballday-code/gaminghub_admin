import { useState } from 'react';
import type { LoginRequest } from '@services/types/api.types';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { setCredentials } from '@store/slices/authSlice';
import { useLogin } from '@services/api/hooks';
import { authApi } from '@services/api/auth.api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@utils/constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@services/api/hooks/useAuthQueries';

export const useLoginLogic = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const verifyTwoFactorMutation = useMutation({
    mutationFn: (payload: { pendingToken: string; code: string }) =>
      authApi.verifyLoginTwoFactor(payload),
    onSuccess: (authData) => {
      if (!authData.accessToken || !authData.user) {
        dispatch(addToast({
          message: '2FA verify response invalid hai. Backend contract check karo.',
          type: 'error',
          duration: 5000,
        }));
        return;
      }
      dispatch(setCredentials({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        user: authData.user,
      }));
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      navigate(ROUTES.DASHBOARD);
    },
  });
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [pendingToken, setPendingToken] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      const errorMsg = 'Email is required';
      setError(errorMsg);
      dispatch(addToast({
        message: errorMsg,
        type: 'error',
        duration: 4000,
      }));
      return false;
    }
    if (!formData.password.trim()) {
      const errorMsg = 'Password is required';
      setError(errorMsg);
      dispatch(addToast({
        message: errorMsg,
        type: 'error',
        duration: 4000,
      }));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      const errorMsg = 'Please enter a valid email address';
      setError(errorMsg);
      dispatch(addToast({
        message: errorMsg,
        type: 'error',
        duration: 4000,
      }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpRequired(false);
    setPendingToken('');
    setOtpCode('');

    if (!validateForm()) {
      return;
    }

    try {
      // Fetch CSRF token before login - REQUIRED
      const csrfToken = await authApi.getCsrfToken();
      
      if (!csrfToken) {
        const errorMsg = 'Failed to get CSRF token. Please try again.';
        setError(errorMsg);
        dispatch(addToast({
          message: errorMsg,
          type: 'error',
          duration: 5000,
        }));
        return;
      }
      
      // Use TanStack Query mutation
      loginMutation.mutate(formData, {
        onSuccess: (data) => {
          if (data.requiresTwoFactor || !data.accessToken) {
            const incomingPendingToken = data.pendingToken;
            if (!incomingPendingToken) {
              dispatch(addToast({
                message: '2FA pending token missing hai. Backend response check karo.',
                type: 'error',
                duration: 5000,
              }));
              return;
            }
            setPendingToken(incomingPendingToken);
            setOtpRequired(true);
            dispatch(addToast({
              message: '2FA enabled hai. Login complete karne ke liye OTP enter karo.',
              type: 'info',
              duration: 4500,
            }));
          }
        },
        onError: () => {
          // Error will be handled by API interceptor and shown via toaster
          // Only keep error state for validation errors (handled in validateForm)
        },
      });
    } catch (error: any) {
      // CSRF token fetch failed - block login
      const errorMsg = error?.response?.status === 404 
        ? 'CSRF token endpoint not found. Please contact administrator.'
        : 'Failed to get CSRF token. Please try again.';
      setError(errorMsg);
      dispatch(addToast({
        message: errorMsg,
        type: 'error',
        duration: 5000,
      }));
      console.error('CSRF token fetch failed, login blocked:', error);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      dispatch(addToast({
        message: 'OTP required hai.',
        type: 'warning',
        duration: 4000,
      }));
      return;
    }

    const code = otpCode.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(code)) {
      dispatch(addToast({
        message: '6-digit numeric code enter karo.',
        type: 'warning',
        duration: 4000,
      }));
      return;
    }

    if (!pendingToken) {
      dispatch(addToast({
        message: 'Pending token missing hai. Dobara login karo.',
        type: 'error',
        duration: 5000,
      }));
      return;
    }

    verifyTwoFactorMutation.mutate({ pendingToken, code });
  };

  const handleBackToPasswordStep = () => {
    setOtpRequired(false);
    setOtpCode('');
    setPendingToken('');
  };

  const handleOtpCodeChange = (value: string) => {
    setOtpCode(value.replace(/\D/g, '').slice(0, 6));
  };

  return {
    formData,
    loading: loginMutation.isPending || verifyTwoFactorMutation.isPending,
    error,
    showPassword,
    otpCode,
    otpRequired,
    togglePasswordVisibility,
    handleInputChange,
    handleOtpCodeChange,
    handleSubmit,
    handleVerifyOtp,
    handleBackToPasswordStep,
  };
};

