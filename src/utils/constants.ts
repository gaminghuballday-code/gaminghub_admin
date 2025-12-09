export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gaminghuballday.buzz';
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'booyahx-admin';

// Admin Routes
export const ADMIN_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HEALTH: '/health',
  PROFILE: '/profile',
  GENERATE_LOBBY: '/generate-lobby',
  TOP_UP: '/top-up',
  HOST_CREATION: '/host-creation',
  USER_HISTORY: '/user-history',
} as const;

// User Routes
export const USER_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
  TOURNAMENTS: '/tournaments',
  LOBBY: '/lobby',
  HISTORY: '/history',
  WALLET: '/wallet',
} as const;

// Legacy ROUTES for backward compatibility (admin routes)
export const ROUTES = ADMIN_ROUTES;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
} as const;

// Domain detection
export const isAdminDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // Check for explicit mode override via query parameter (for localhost testing)
  const modeParam = searchParams.get('mode');
  if (modeParam === 'admin') return true;
  if (modeParam === 'user') return false;
  
  // Check environment variable for admin domain
  const adminDomain = import.meta.env.VITE_ADMIN_DOMAIN || 'admin';
  const userDomain = import.meta.env.VITE_USER_DOMAIN || '';
  
  // If user domain is set and current hostname matches it, return false (user app)
  if (userDomain && hostname === userDomain) {
    return false;
  }
  
  // Check if hostname starts with admin subdomain or contains admin
  if (hostname.startsWith(`${adminDomain}.`) || hostname.includes(adminDomain)) {
    return true;
  }
  
  // For localhost: default to user app unless explicitly set to admin
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check if there's a localStorage preference
    const savedMode = localStorage.getItem('app_mode');
    if (savedMode === 'admin') return true;
    if (savedMode === 'user') return false;
    
    // Default to user app on localhost (can be changed via ?mode=admin)
    return false;
  }
  
  // Production: if hostname doesn't match admin domain, it's user app
  return false;
};

