import { useState } from 'react';
import type { ForgotPasswordRequest } from '@services/types/api.types';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { useForgotPassword } from '@services/api/hooks/useUserAuthQueries';
import { authApi } from '@services/api/auth.api';

export const useForgotPasswordLogic = () => {
  const dispatch = useAppDispatch();
  const forgotPasswordMutation = useForgotPassword();
  const [formData, setFormData] = useState<ForgotPasswordRequest>({
    email: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      // Fetch CSRF token before forgot password request
      await authApi.getCsrfToken();
      
      forgotPasswordMutation.mutate(formData, {
        onSuccess: () => {
          // Open OTP modal after OTP is sent
          setShowOtpModal(true);
        },
        onError: () => {
          // Error will be handled by API interceptor and shown via toaster
        },
      });
    } catch (error: any) {
      // CSRF token fetch failed, but continue with forgot password anyway
      console.warn('CSRF token fetch failed, continuing with forgot password:', error);
      forgotPasswordMutation.mutate(formData, {
        onSuccess: () => {
          // Open OTP modal after OTP is sent
          setShowOtpModal(true);
        },
        onError: () => {
          // Error will be handled by API interceptor and shown via toaster
        },
      });
    }
  };

  return {
    formData,
    loading: forgotPasswordMutation.isPending,
    showOtpModal,
    setShowOtpModal,
    error,
    handleInputChange,
    handleSubmit,
  };
};

