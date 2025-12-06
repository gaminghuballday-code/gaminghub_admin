import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/store'
import { selectTheme } from './store/slices/themeSlice'
import App from './App.tsx'
import './assets/styles/dashboard.scss'

// Create QueryClient instance - must be created outside component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Cache time: unused data stays in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests 1 time
      retry: 1,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations 0 times (mutations shouldn't retry by default)
      retry: 0,
    },
  },
})

// Initialize theme on app load - ensure dark is default
const initializeTheme = () => {
  const theme = selectTheme(store.getState());
  // Ensure data-theme is set (defaults to dark if not set)
  const finalTheme = theme || 'dark';
  document.documentElement.setAttribute('data-theme', finalTheme);
  
  // If no theme in localStorage, set it to dark
  if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'dark');
  }
};

initializeTheme();

// Subscribe to theme changes
store.subscribe(() => {
  const theme = selectTheme(store.getState());
  document.documentElement.setAttribute('data-theme', theme);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
