import apiClient from './client';
import { store } from '../../store/store';
import { selectRefreshToken } from '../../store/slices/authSlice';
import type {
  PlatformStatsResponse,
  AnalyticsDataPoint,
  AnalyticsResponse,
  AnalyticsTotals,
  AuthResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types/api.types';

type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

interface RawAnalyticsDataPoint {
  period?: string;
  date?: string;
  platformFee?: number;
  casterFee?: number;
  totalIncome?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  deposits?: number;
  withdrawals?: number;
  profit?: number;
  income?: number;
  rewards?: number;
}

interface RawAnalyticsPayload {
  period?: AnalyticsPeriod;
  data?: RawAnalyticsDataPoint[];
  analytics?: RawAnalyticsDataPoint[];
  selectedPeriodTotals?: Partial<AnalyticsTotals>;
  overallTotals?: Partial<AnalyticsTotals>;
}

interface AnalyticsApiEnvelope {
  data?: RawAnalyticsPayload | RawAnalyticsDataPoint[];
}

interface AdminLogoutRequest {
  refreshToken: string;
}

export interface AdminDeviceHistoryItem {
  id: string;
  deviceName: string;
  platform: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrentDevice: boolean;
}

export interface AdminDevicesResponse {
  devices: AdminDeviceHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === 'string';

const normalizeDeviceItem = (raw: unknown, index: number): AdminDeviceHistoryItem => {
  const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rawId = item.id ?? item._id ?? item.deviceId ?? `device-${index + 1}`;
  const id = isString(rawId) ? rawId : `device-${index + 1}`;

  const browser = isString(item.browser) ? item.browser : '';
  const deviceName = isString(item.deviceName)
    ? item.deviceName
    : isString(item.device)
      ? item.device
      : isString(item.userAgent)
        ? item.userAgent
        : isString(item.platform)
          ? item.platform
          : 'Device';

  return {
    id,
    deviceName,
    platform: isString(item.platform) ? item.platform : '',
    browser,
    ipAddress: isString(item.ipAddress) ? item.ipAddress : '',
    location: isString(item.location) ? item.location : '',
    lastActiveAt: isString(item.lastActiveAt)
      ? item.lastActiveAt
      : isString(item.lastSeenAt)
        ? item.lastSeenAt
        : isString(item.updatedAt)
          ? item.updatedAt
          : '',
    createdAt: isString(item.createdAt) ? item.createdAt : '',
    isCurrentDevice: item.isCurrentDevice === true || item.currentDevice === true,
  };
};

const normalizePlatformStats = (raw: unknown): PlatformStatsResponse['data'] => {
  if (!raw || typeof raw !== 'object') {
    return {
      totalUsers: 0,
      totalIncome: 0,
      totalRewards: 0,
      totalProfit: 0,
      userGrowth: 0,
      incomeGrowth: 0,
    };
  }

  const data = raw as Record<string, unknown>;
  const breakdown = (data.breakdown && typeof data.breakdown === 'object'
    ? (data.breakdown as Record<string, unknown>)
    : undefined);

  const totalUsers = isNumber(data.totalUsers) ? data.totalUsers : 0;
  const totalDeposit = isNumber(data.totalDeposit)
    ? data.totalDeposit
    : isNumber(data.totalIncome)
      ? data.totalIncome
      : isNumber(data.totalTopupGC)
        ? data.totalTopupGC
        : 0;

  const totalRewards = isNumber(data.totalRewards)
    ? data.totalRewards
    : isNumber(data.totalWithdraw)
      ? data.totalWithdraw
      : isNumber(data.totalWinDraw)
        ? data.totalWinDraw
        : 0;

  const platformFeeCollected = isNumber(data.platformFeeCollected)
    ? data.platformFeeCollected
    : isNumber(data.platformFee)
      ? data.platformFee
      : isNumber(breakdown?.platformFee)
        ? breakdown.platformFee
        : 0;

  const casterFeeCollected = isNumber(data.casterFeeCollected)
    ? data.casterFeeCollected
    : isNumber(data.casterFee)
      ? data.casterFee
      : isNumber(breakdown?.casterFee)
        ? breakdown.casterFee
        : 0;

  const netProfit = isNumber(data.netProfit)
    ? data.netProfit
    : isNumber(data.totalProfit)
      ? data.totalProfit
      : isNumber(data.platformProfit)
        ? data.platformProfit
        : platformFeeCollected + casterFeeCollected;

  return {
    totalUsers,
    totalIncome: totalDeposit,
    totalRewards,
    totalProfit: netProfit,
    userGrowth: isNumber(data.userGrowth) ? data.userGrowth : 0,
    incomeGrowth: isNumber(data.incomeGrowth) ? data.incomeGrowth : 0,
    totalDeposit,
    totalTopupGC: isNumber(data.totalTopupGC) ? data.totalTopupGC : totalDeposit,
    totalWithdraw: isNumber(data.totalWithdraw) ? data.totalWithdraw : totalRewards,
    totalWinDraw: isNumber(data.totalWinDraw) ? data.totalWinDraw : totalRewards,
    platformFeeCollected,
    casterFeeCollected,
    platformProfit: isNumber(data.platformProfit) ? data.platformProfit : netProfit,
    netProfit,
  };
};

export const adminApi = {
  /**
   * Get current admin profile
   */
  getProfile: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<{ data: AuthResponse['user'] }>('/api/admin/profile');
    return response.data.data;
  },

  /**
   * Update current admin profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<AuthResponse['user']> => {
    const response = await apiClient.put<{ data: AuthResponse['user'] }>('/api/admin/profile', data);
    return response.data.data;
  },

  /**
   * Change password (shared auth route; invalidates refresh tokens per API docs)
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put('/api/auth/change-password', data);
  },

  /**
   * Logout admin from current device (refresh token required)
   */
  logout: async (): Promise<void> => {
    const state = store.getState();
    const refreshToken = selectRefreshToken(state);
    if (!refreshToken) {
      throw new Error('Refresh token is required to logout');
    }

    await apiClient.post('/api/admin/logout', { refreshToken } as AdminLogoutRequest);
  },

  /**
   * Logout admin from all devices
   */
  logoutAll: async (): Promise<void> => {
    await apiClient.post('/api/admin/logout-all');
  },

  /**
   * Get admin devices history with pagination
   */
  getDevices: async (page = 1, limit = 10): Promise<AdminDevicesResponse> => {
    const response = await apiClient.get<{ data?: unknown }>('/api/admin/devices', {
      params: { page, limit },
    });

    const data = (response.data?.data && typeof response.data.data === 'object'
      ? response.data.data
      : {}) as Record<string, unknown>;

    const rawDevices = Array.isArray(data.devices)
      ? data.devices
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

    const paginationObj = (data.pagination && typeof data.pagination === 'object'
      ? data.pagination
      : {}) as Record<string, unknown>;

    const total = isNumber(paginationObj.total)
      ? paginationObj.total
      : isNumber(data.total)
        ? data.total
        : rawDevices.length;

    const totalPages = isNumber(paginationObj.totalPages)
      ? paginationObj.totalPages
      : Math.max(1, Math.ceil(total / Math.max(limit, 1)));

    const currentPage = isNumber(paginationObj.page)
      ? paginationObj.page
      : isNumber(data.page)
        ? data.page
        : page;

    return {
      devices: rawDevices.map((device, index) => normalizeDeviceItem(device, index)),
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasNextPage: paginationObj.hasNextPage === true || currentPage < totalPages,
        hasPrevPage: paginationObj.hasPrevPage === true || currentPage > 1,
      },
    };
  },

  /**
   * Get platform-wide statistics (Admin only)
   */
  getPlatformStats: async (): Promise<PlatformStatsResponse['data']> => {
    try {
      const response = await apiClient.get<PlatformStatsResponse>('/api/admin/dashboard/stats');
      return normalizePlatformStats(response.data.data);
    } catch (error) {
      console.warn('Platform stats API failed, using mock data:', error);
      // Return mock data for development if API is not available
      return {
        totalUsers: 1250,
        totalIncome: 150000,
        totalRewards: 85000,
        totalProfit: 65000,
        userGrowth: 15.5,
        incomeGrowth: 12.2,
      };
    }
  },

  /**
   * Get analytical reports (Admin only)
   * @param period - 'daily' | 'weekly' | 'monthly'
   */
  getAnalytics: async (period: AnalyticsPeriod = 'daily'): Promise<AnalyticsResponse> => {
    try {
      const response = await apiClient.get<AnalyticsApiEnvelope>('/api/admin/analytics', {
        params: { period }
      });

      const payload = response.data?.data;
      const rawPoints: RawAnalyticsDataPoint[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.analytics)
            ? payload.analytics
            : [];

      const normalizeTotals = (totals?: Partial<AnalyticsTotals>): AnalyticsTotals => ({
        platformFee: totals?.platformFee ?? 0,
        casterFee: totals?.casterFee ?? 0,
        totalIncome: totals?.totalIncome ?? 0,
        totalDeposit: totals?.totalDeposit ?? 0,
        totalWithdraw: totals?.totalWithdraw ?? 0,
      });

      const normalizedData: AnalyticsDataPoint[] = rawPoints.map((item) => {
        const platformFee = item.platformFee ?? 0;
        const casterFee = item.casterFee ?? 0;
        const totalIncome = item.totalIncome ?? item.profit ?? item.income ?? platformFee + casterFee;
        const totalDeposit = item.totalDeposit ?? item.deposits ?? 0;
        const totalWithdraw = item.totalWithdraw ?? item.withdrawals ?? item.rewards ?? 0;
        const periodValue = item.period ?? item.date ?? '';

        return {
          period: periodValue,
          platformFee,
          casterFee,
          totalIncome,
          totalDeposit,
          totalWithdraw,
          date: periodValue,
          deposits: totalDeposit,
          withdrawals: totalWithdraw,
          profit: totalIncome,
          income: totalIncome,
          rewards: totalWithdraw,
        };
      });

      return {
        period: (Array.isArray(payload) ? undefined : payload?.period) ?? period,
        data: normalizedData,
        selectedPeriodTotals: normalizeTotals(Array.isArray(payload) ? undefined : payload?.selectedPeriodTotals),
        overallTotals: normalizeTotals(Array.isArray(payload) ? undefined : payload?.overallTotals),
      };
    } catch (error) {
      console.warn('Analytics API failed, using mock data:', error);
      // Generate mock data based on period
      const mockData: AnalyticsDataPoint[] = [];
      const count = period === 'daily' ? 7 : period === 'weekly' ? 8 : 6;
      const today = new Date();
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(today);
        if (period === 'daily') date.setDate(today.getDate() - i);
        if (period === 'weekly') date.setDate(today.getDate() - (i * 7));
        if (period === 'monthly') date.setMonth(today.getMonth() - i);
        
        const totalIncome = Math.floor(Math.random() * 10000) + 5000;
        const totalDeposit = Math.floor(Math.random() * 7000) + 3000;
        const totalWithdraw = Math.floor(Math.random() * 4000) + 1500;
        const platformFee = Math.floor(totalIncome * 0.7);
        const casterFee = totalIncome - platformFee;
        const periodValue = period === 'daily'
          ? date.toISOString().split('T')[0]
          : period === 'weekly'
            ? `Week ${count - i}`
            : date.toISOString().slice(0, 7);
        
        mockData.push({
          period: periodValue,
          platformFee,
          casterFee,
          totalIncome,
          totalDeposit,
          totalWithdraw,
          date: periodValue,
          deposits: totalDeposit,
          withdrawals: totalWithdraw,
          profit: totalIncome,
          income: totalIncome,
          rewards: totalWithdraw,
        });
      }
      const totals = mockData.reduce<AnalyticsTotals>((acc, item) => {
        acc.platformFee += item.platformFee;
        acc.casterFee += item.casterFee;
        acc.totalIncome += item.totalIncome;
        acc.totalDeposit += item.totalDeposit;
        acc.totalWithdraw += item.totalWithdraw;
        return acc;
      }, {
        platformFee: 0,
        casterFee: 0,
        totalIncome: 0,
        totalDeposit: 0,
        totalWithdraw: 0,
      });

      return {
        period,
        data: mockData,
        selectedPeriodTotals: totals,
        overallTotals: totals,
      };
    }
  }
};
