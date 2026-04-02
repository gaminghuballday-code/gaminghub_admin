export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gaminghuballday.buzz';
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'booyahx-admin';

// Public app download link (served from /public/apk/Booyahx.apk)
export const ANDROID_APK_URL = import.meta.env.VITE_ANDROID_APK_URL || '/apk/Booyahx.apk';

/**
 * Absolute URL builder for public-facing links (QR codes, sharing).
 * Relative paths use VITE_PUBLIC_SITE_URL when set (production domain or LAN IP),
 * otherwise window.location.origin. On localhost, we prefer `VITE_USER_DOMAIN`
 * because phones cannot open http://localhost.
 */
export const getPublicAbsoluteUrl = (urlOrPath: string): string => {
  const raw = urlOrPath.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const configuredBase = import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configuredBase) return `${configuredBase}${path}`;

  if (typeof window !== 'undefined') {
    const adminSubdomain = import.meta.env.VITE_ADMIN_DOMAIN || 'admin';
    const userDomain = import.meta.env.VITE_USER_DOMAIN?.trim().replace(/\/$/, '');
    const host = window.location.hostname;
    const isLoopback = host === 'localhost' || host === '127.0.0.1';

    // If we are on the admin domain/subdomain, generate links for the user site.
    // This prevents QR codes from pointing to the admin origin.
    const isAdminHost =
      isAdminDomain() ||
      (adminSubdomain ? host === adminSubdomain || host.startsWith(`${adminSubdomain}.`) : false);
    if (isAdminHost && userDomain && !userDomain.includes('localhost')) {
      return `https://${userDomain}${path}`;
    }

    if (isLoopback && userDomain && !userDomain.includes('localhost')) {
      return `https://${userDomain}${path}`;
    }
    return `${window.location.origin}${path}`;
  }

  return path;
};

export const getAndroidApkAbsoluteUrl = (): string => getPublicAbsoluteUrl(ANDROID_APK_URL);

export const getDownloadsAbsoluteUrl = (): string => getPublicAbsoluteUrl(STATIC_ROUTES.DOWNLOADS);

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
  WITHDRAWALS: '/withdrawals',
  HOST_CREATION: '/host-creation',
  USER_HISTORY: '/user-history',
  ENQUIRIES: '/enquiries',
  SUPPORT_TICKETS: '/support-tickets',
  NOTIFICATIONS: '/notifications',
} as const;

// User Routes
export const USER_ROUTES = {
  HOME: '/home',
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
  DOWNLOADS: '/downloads',
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
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  CSRF_TOKEN: 'csrf_token',
} as const;

/**
 * Get namespaced storage key based on app mode (admin vs user)
 * This prevents token collision when running both apps on the same domain/IP (like localhost)
 */
export const getStorageKey = (key: keyof typeof STORAGE_KEYS): string => {
  const isAdmin = isAdminDomain();
  const prefix = isAdmin ? 'admin_' : 'user_';
  return `${prefix}${STORAGE_KEYS[key]}`;
};

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
    
    // Port 3002 is specifically for admin app
    if (port === '3002') {
      localStorage.setItem('app_mode', 'admin');
      return true;
    }
    
    // Port 3001 is for user app
    if (port === '3001') {
      localStorage.setItem('app_mode', 'user');
      return false;
    }

    // Some environments might use 3000 for admin if it's the only one running
    // but we check if the storage explicitly says admin
    const savedMode = localStorage.getItem('app_mode');
    if (savedMode === 'admin' && port === '3000') return true;
    if (savedMode === 'user' && port === '3000') return false;
    
    // Check localStorage preference for other ports
    if (savedMode === 'admin') return true;
    if (savedMode === 'user') return false;
    
    // Default to user app on localhost (can be changed via ?mode=admin)
    return false;
  }
  
  // Explicitly check if hostname is admin subdomain (e.g., admin.gaminghuballday.buzz)
  if (adminSubdomain && hostname.startsWith(`${adminSubdomain}.`)) {
    return true; // Admin app
  }
  
  // If hostname is the admin domain exactly
  if (adminSubdomain && hostname === adminSubdomain) {
    return true;
  }
  
  // Explicitly check if hostname matches user domain exactly (e.g., gaminghuballday.buzz)
  if (userDomain && hostname === userDomain) {
    return false; // User app
  }
  
  // If hostname ends with user domain (e.g., www.gaminghuballday.buzz), it's user app
  // But exclude admin subdomain (already checked above)
  if (userDomain && hostname.endsWith(`.${userDomain}`) && !hostname.startsWith(`${adminSubdomain}.`)) {
    return false; // User app
  }
  
  // Default: if hostname doesn't match admin subdomain patterns, it's user app
  return false;
};

