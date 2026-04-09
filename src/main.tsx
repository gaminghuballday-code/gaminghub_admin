import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/store'
import { selectTheme } from './store/slices/themeSlice'
import { isAdminDomain } from './utils/constants'
import { USER_APP_DEFAULT_DOCUMENT_TITLE } from './utils/seo'
import App from './App.tsx'
import UserApp from './UserApp.tsx'
import './assets/styles/dashboard.scss'

// Disable browser autofill across the entire app.
const disableBrowserAutofillGlobally = () => {
  const applyAutocompleteOff = (root: ParentNode) => {
    const formElements = root.querySelectorAll('form')
    formElements.forEach((form) => {
      form.setAttribute('autocomplete', 'off')
    })

    const fieldElements = root.querySelectorAll('input, textarea, select')
    fieldElements.forEach((field) => {
      const input = field as HTMLInputElement
      input.setAttribute('autocomplete', 'off')
      input.setAttribute('autocorrect', 'off')
      input.setAttribute('autocapitalize', 'off')
      input.setAttribute('spellcheck', 'false')
    })
  }

  applyAutocompleteOff(document)

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches('form,input,textarea,select')) {
            const element = node as HTMLInputElement
            element.setAttribute('autocomplete', 'off')
            element.setAttribute('autocorrect', 'off')
            element.setAttribute('autocapitalize', 'off')
            element.setAttribute('spellcheck', 'false')
          }
          applyAutocompleteOff(node)
        }
      })
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

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
disableBrowserAutofillGlobally();

// Subscribe to theme changes
store.subscribe(() => {
  const theme = selectTheme(store.getState());
  document.documentElement.setAttribute('data-theme', theme);
});

// Determine which app to render based on domain
const isAdmin = isAdminDomain();
const AppComponent = isAdmin ? App : UserApp;

// Set document title based on domain
document.title = isAdmin ? 'Booyahx Admin' : USER_APP_DEFAULT_DOCUMENT_TITLE;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppComponent />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
