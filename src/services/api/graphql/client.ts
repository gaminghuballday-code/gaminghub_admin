import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { store } from '../../../store/store';
import { selectAccessToken, logout } from '../../../store/slices/authSlice';
import { addToast } from '../../../store/slices/toastSlice';

// GraphQL endpoint - typically /graphql on the API base URL
// Use relative URL to leverage proxy (Vite in dev, Vercel in production)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const GRAPHQL_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/graphql` : '/graphql';

// HTTP Link
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include',
});

// Auth Link - Add authorization header
const authLink = setContext((_, { headers }) => {
  const state = store.getState();
  const token = selectAccessToken(state);
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error Link - Handle errors globally
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      const status = extensions?.status as number | undefined;
      
      // Handle 401 Unauthorized
      if (status === 401) {
        const isOnLoginPage = window.location.pathname.includes('/login');
        
        if (isOnLoginPage && message && message.trim().length > 0) {
          store.dispatch(addToast({
            message: message.trim(),
            type: 'error',
            duration: 6000,
          }));
        } else {
          store.dispatch(logout());
          window.location.href = '/login';
        }
      } else if (message && message.trim().length > 0) {
        // Show error toast for other GraphQL errors
        store.dispatch(addToast({
          message: message.trim(),
          type: 'error',
          duration: 6000,
        }));
      }
    });
  }

  if (networkError) {
    const errorMessage = networkError.message || 'Network error occurred';
    store.dispatch(addToast({
      message: errorMessage,
      type: 'error',
      duration: 6000,
    }));
  }
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Add field policies for pagination if needed
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

