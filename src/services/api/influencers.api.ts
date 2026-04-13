import apiClient from './client';

export interface InviteInfluencerRequest {
  email: string;
  name: string;
}

export interface InviteInfluencerResponse {
  status: number;
  success: boolean;
  message: string;
  data?: unknown;
}

/** Normalized summary from GET /api/admin/influencers/statistics */
export interface InfluencerStatisticsData {
  influencerAccounts: number;
  paidReferralsCount: number;
  totalGcPaidToInfluencers: number;
}

export interface InfluencerStatisticsResponse {
  status: number;
  success: boolean;
  message: string;
  data: unknown;
}

const parseFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
};

/**
 * Accepts flat fields or nested `influencerProgram` (same shape as dashboard stats).
 */
export const normalizeInfluencerStatisticsData = (raw: unknown): InfluencerStatisticsData => {
  const empty: InfluencerStatisticsData = {
    influencerAccounts: 0,
    paidReferralsCount: 0,
    totalGcPaidToInfluencers: 0,
  };
  if (!raw || typeof raw !== 'object') {
    return empty;
  }
  const o = raw as Record<string, unknown>;
  const nested =
    o.influencerProgram && typeof o.influencerProgram === 'object'
      ? (o.influencerProgram as Record<string, unknown>)
      : o;
  return {
    influencerAccounts: parseFiniteNumber(nested.influencerAccounts) ?? 0,
    paidReferralsCount: parseFiniteNumber(nested.paidReferralsCount) ?? 0,
    totalGcPaidToInfluencers: parseFiniteNumber(nested.totalGcPaidToInfluencers) ?? 0,
  };
};

export const influencersApi = {
  invite: async (data: InviteInfluencerRequest): Promise<InviteInfluencerResponse> => {
    const response = await apiClient.post<InviteInfluencerResponse>(
      '/api/admin/influencers/invite',
      data
    );
    return response.data;
  },

  /**
   * Static influencer program statistics (Admin only), same pattern as GET /api/admin/hosts/statistics.
   */
  getInfluencerStatistics: async (): Promise<InfluencerStatisticsData> => {
    const response = await apiClient.get<InfluencerStatisticsResponse>(
      '/api/admin/influencers/statistics'
    );
    return normalizeInfluencerStatisticsData(response.data?.data);
  },
};
