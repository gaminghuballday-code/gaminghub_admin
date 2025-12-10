import { useState } from 'react';
import type { LoginRequest } from '@services/types/api.types';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { useLogin } from '@services/api/hooks';
import { authApi } from '@services/api/auth.api';

export const useLoginLogic = () => {
  const dispatch = useAppDispatch();
  const loginMutation = useLogin();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  return {
    formData,
    loading: loginMutation.isPending,
    error,
    showPassword,
    togglePasswordVisibility,
    handleInputChange,
    handleSubmit,
  };
};

