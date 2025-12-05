import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import { useProfile } from '@services/api/hooks';

export const useProfileLogic = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Load profile if not already in Redux
  useProfile(isAuthenticated && !user);

  useEffect(() => {
    // Check authentication from Redux
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
  }, [navigate, isAuthenticated]);

  return {
    user,
  };
};

