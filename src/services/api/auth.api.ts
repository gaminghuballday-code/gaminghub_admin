import { apolloClient } from './graphql/client';
import { LOGIN_MUTATION, LOGOUT_MUTATION, GET_PROFILE_QUERY } from './graphql/queries';
import type { LoginRequest, AuthResponse } from '../types/api.types';
import { store } from '../../store/store';
import { selectRefreshToken } from '../../store/slices/authSlice';

export const authApi = {
  /**
   * Login admin user
   * Note: Redux state will be updated by the component calling this
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apolloClient.mutate<{ 
      login: {
        accessToken: string;
        refreshToken?: string;
        user: {
          _id?: string;
          email: string;
          name?: string;
          role?: string;
          isEmailVerified?: boolean;
        };
      };
    }>({
      mutation: LOGIN_MUTATION,
      variables: {
        input: {
          email: data.email,
          password: data.password,
        },
      },
    });
    
    const loginResponse = response.data?.login;
    
    if (!loginResponse?.accessToken) {
      throw new Error('Access token not received from server');
    }
    
    // Map _id to userId for consistency
    const authData: AuthResponse = {
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      user: {
        userId: loginResponse.user._id || '',
        email: loginResponse.user.email,
        name: loginResponse.user.name,
        role: loginResponse.user.role,
        isEmailVerified: loginResponse.user.isEmailVerified,
      },
    };
    
    return authData;
  },

  /**
   * Logout user
   * Note: Redux state will be updated by the component calling this
   */
  logout: async (): Promise<void> => {
    // Get refresh token from Redux store
    const state = store.getState();
    const refreshToken: any = selectRefreshToken(state as any);
    
    try {
      await apolloClient.mutate({
        mutation: LOGOUT_MUTATION,
        variables: refreshToken ? { input: { refreshToken } } : { input: {} },
      });
    } catch (error: any) {
      // Silently ignore errors - logout should proceed even if API call fails
      console.warn('Logout API call failed:', error?.message || 'Unknown error');
    }
    // Note: Redux state will be cleared by the component
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<AuthResponse['user']> => {
    const response = await apolloClient.query<{ profile: AuthResponse['user'] }>({
      query: GET_PROFILE_QUERY,
      fetchPolicy: 'network-only',
    });
    
    if (!response.data?.profile) {
      throw new Error('Profile data not received from server');
    }
    
    return response.data.profile;
  },
};

