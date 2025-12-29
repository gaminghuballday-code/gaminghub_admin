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
  PAYMENT_VERIFICATION: '/payment-verification',
  HOST_CREATION: '/host-creation',
  USER_HISTORY: '/user-history',
  ENQUIRIES: '/enquiries',
  SUPPORT_TICKETS: '/support-tickets',
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
  SUPPORT: '/support',
} as const;

// Static Pages (Public - accessible from both admin and user)
export const STATIC_ROUTES = {
  CANCELLATION_REFUNDS: '/cancellation-refunds',
  TERMS_CONDITIONS: '/terms-conditions',
  SHIPPING: '/shipping',
  PRIVACY: '/privacy',
  CONTACT_US: '/contact-us',
} as const;

// Legacy ROUTES for backward compatibility (admin routes)
export const ROUTES = ADMIN_ROUTES;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  CSRF_TOKEN: 'csrf_token',
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
  
  // Get domain configuration from environment variables
  const adminSubdomain = import.meta.env.VITE_ADMIN_DOMAIN || 'admin';
  const userDomain = import.meta.env.VITE_USER_DOMAIN || 'gaminghuballday.buzz';
  
  // For localhost: check port and localStorage preference
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port;
    // Port 3002 is for admin app
    if (port === '3002') {
      localStorage.setItem('app_mode', 'admin');
      return true;
    }
    // Port 3001 is for user app
    if (port === '3001') {
      localStorage.setItem('app_mode', 'user');
      return false;
    }
    // Check localStorage preference for other ports
    const savedMode = localStorage.getItem('app_mode');
    if (savedMode === 'admin') return true;
    if (savedMode === 'user') return false;
    // Default to user app on localhost (can be changed via ?mode=admin)
    return false;
  }
  
  // Explicitly check if hostname is admin subdomain (e.g., admin.gaminghuballday.buzz)
  // Pattern: adminSubdomain.userDomain or adminSubdomain.anything
  if (adminSubdomain && hostname.startsWith(`${adminSubdomain}.`)) {
    return true; // Admin app
  }
  
  // Explicitly check if hostname matches user domain exactly (e.g., gaminghuballday.buzz)
  // This takes priority - if it matches user domain, it's user app
  if (userDomain && hostname === userDomain) {
    return false; // User app
  }
  
  // If hostname ends with user domain (e.g., www.gaminghuballday.buzz), it's user app
  // But exclude admin subdomain (already checked above)
  if (userDomain && hostname.endsWith(`.${userDomain}`) && !hostname.startsWith(`${adminSubdomain}.`)) {
    return false; // User app
  }
  
  // Default: if hostname doesn't match admin subdomain pattern, it's user app
  return false;
};

