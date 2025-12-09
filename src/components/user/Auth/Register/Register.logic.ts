import { useState } from 'react';
import type { RegisterRequest } from '@services/types/api.types';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { useUserRegister, useGoogleLogin } from '@services/api/hooks/useUserAuthQueries';
import { getGoogleIdToken } from '@utils/googleAuth';

interface RegisterFormData extends RegisterRequest {
  confirmPassword?: string;
}

export const useRegisterLogic = () => {
  const dispatch = useAppDispatch();
  const registerMutation = useUserRegister();
  const googleLoginMutation = useGoogleLogin();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
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
    if (formData.password.length < 6) {
      const errorMsg = 'Password must be at least 6 characters';
      setError(errorMsg);
      dispatch(addToast({
        message: errorMsg,
        type: 'error',
        duration: 4000,
      }));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      const errorMsg = 'Passwords do not match';
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

    const { confirmPassword, ...registerData } = formData;
    registerMutation.mutate(registerData, {
      onError: () => {
        // Error will be handled by API interceptor and shown via toaster
      },
    });
  };

  const handleGoogleLogin = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
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
    loading: registerMutation.isPending,
    googleLoading: googleLoading || googleLoginMutation.isPending,
    error,
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    handleInputChange,
    handleSubmit,
    handleGoogleLogin,
  };
};

