import { useState } from 'react';
import type { LoginRequest } from '@services/types/api.types';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { useUserLogin, useGoogleLogin } from '@services/api/hooks/useUserAuthQueries';
import { getGoogleIdToken } from '@utils/googleAuth';

export const useLoginLogic = () => {
  const dispatch = useAppDispatch();
  const loginMutation = useUserLogin();
  const googleLoginMutation = useGoogleLogin();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

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

    loginMutation.mutate(formData, {
      onError: () => {
        // Error will be handled by API interceptor and shown via toaster
      },
    });
  };

  const handleGoogleLogin = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    
    if (!googleClientId) {
      dispatch(addToast({
        message: 'Google OAuth is not configured. Please contact support.',
        type: 'error',
        duration: 5000,
      }));
      return;
    }

    setGoogleLoading(true);
    try {
      // Get Google ID token
      const { idToken, name } = await getGoogleIdToken(googleClientId);
      
      // Send to backend
      googleLoginMutation.mutate({ idToken, name }, {
        onError: () => {
          // Error will be handled by API interceptor
          setGoogleLoading(false);
        },
        onSuccess: () => {
          setGoogleLoading(false);
        },
      });
    } catch (error: any) {
      setGoogleLoading(false);
      dispatch(addToast({
        message: error.message || 'Failed to sign in with Google',
        type: 'error',
        duration: 5000,
      }));
    }
  };

  return {
    formData,
    loading: loginMutation.isPending,
    googleLoading: googleLoading || googleLoginMutation.isPending,
    error,
    showPassword,
    togglePasswordVisibility,
    handleInputChange,
    handleSubmit,
    handleGoogleLogin,
  };
};

