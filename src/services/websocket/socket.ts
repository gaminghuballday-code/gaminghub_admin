import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@utils/constants';
import { selectAccessToken } from '@store/slices/authSlice';
import { store } from '@store/store';

// Convert HTTP/HTTPS URL to WebSocket URL
const getWebSocketUrl = (): string => {
  const apiUrl = API_BASE_URL || window.location.origin;
  
  // If API_BASE_URL is set, use it
  if (API_BASE_URL) {
    if (apiUrl.startsWith('https://')) {
      return apiUrl.replace('https://', 'wss://');
    } else if (apiUrl.startsWith('http://')) {
      return apiUrl.replace('http://', 'ws://');
    }
  }
  
  // Fallback: use current origin
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
};

let socketInstance: Socket | null = null;

export const getSocket = (): Socket | null => {
  // If socket exists and is connected, return it
  if (socketInstance?.connected) {
    return socketInstance;
  }

  // If socket exists but not connected, try to reconnect
  if (socketInstance && !socketInstance.connected) {
    socketInstance.connect();
    return socketInstance;
  }

  // Create new socket instance
  const wsUrl = getWebSocketUrl();
  const state = store.getState();
  const token = selectAccessToken(state);

  socketInstance = io(wsUrl, {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    reconnectionDelayMax: 5000,
  });

  socketInstance.on('connect', () => {
    console.log('WebSocket connected:', socketInstance?.id);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socketInstance.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  return socketInstance;
};

export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const isSocketConnected = (): boolean => {
  return socketInstance?.connected ?? false;
};

