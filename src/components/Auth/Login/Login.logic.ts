import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@services/api';
import type { LoginRequest, AuthResponse, ApiError } from '@services/types/api.types';
import { ROUTES } from '@utils/constants';
import { useAppDispatch } from '@store/hooks';
import { setCredentials } from '@store/slices/authSlice';
import { addToast } from '@store/slices/toastSlice';

export const useLoginLogic = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      const response: AuthResponse = await authApi.login(formData);
      
      // Verify token is received
      if (!response.accessToken) {
        // This error will be shown via toaster from API interceptor
        return;
      }

      // Store credentials in Redux (this also persists to localStorage)
      dispatch(setCredentials({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      }));
      
      // Navigate to dashboard
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      // Error will be handled by API interceptor and shown via toaster
      // Only keep error state for validation errors (handled in validateForm)
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    error,
    showPassword,
    togglePasswordVisibility,
    handleInputChange,
    handleSubmit,
  };
};

