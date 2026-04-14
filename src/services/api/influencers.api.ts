import apiClient from './client';

export interface InviteInfluencerRequest {
  email: string;
  name: string;
  referralCode?: string;
}

export interface InviteInfluencerResponse {
  status: number;
  success: boolean;
  message: string;
  data?: unknown;
}

/** Query params for GET /api/admin/influencers/statistics */
export interface GetInfluencerStatisticsParams {
  email?: string;
  id?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
}

export interface InfluencerStatisticsPlatformSummary {
  totalInfluencers: number;
  totalPaidReferrals: number;
}

export interface InfluencerStatisticsRow {
  id: string;
  email: string;
  name?: string;
  paidReferralsCount?: number;
  totalGcPaidToInfluencers?: number;
}

/** Normalized summary from GET /api/admin/influencers/statistics */
export interface InfluencerStatisticsData {
  influencerAccounts: number;
  paidReferralsCount: number;
  totalGcPaidToInfluencers: number;
  platformSummary?: InfluencerStatisticsPlatformSummary;
  influencers: InfluencerStatisticsRow[];
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

const mapInfluencerRow = (item: unknown, index: number): InfluencerStatisticsRow | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const r = item as Record<string, unknown>;
  const user =
    r.user && typeof r.user === 'object' ? (r.user as Record<string, unknown>) : undefined;

  const emailFromTop = typeof r.email === 'string' ? r.email.trim() : '';
  const emailFromUser =
    user && typeof user.email === 'string' ? user.email.trim() : '';
  const emailTrim = emailFromTop || emailFromUser;

  const idRaw = r._id ?? r.id ?? user?._id ?? user?.id;
  const nameRaw =
    typeof r.name === 'string'
      ? r.name.trim()
      : user && typeof user.name === 'string'
        ? user.name.trim()
        : undefined;

  const id =
    idRaw !== undefined && idRaw !== null
      ? String(idRaw)
      : emailTrim || `row-${index}`;

  if (!emailTrim && (idRaw === undefined || idRaw === null)) {
    return null;
  }

  const paid = parseFiniteNumber(r.paidReferralsCount);
  const gc = parseFiniteNumber(r.totalGcPaidToInfluencers);

  return {
    id,
    email: emailTrim || '—',
    ...(nameRaw ? { name: nameRaw } : {}),
    ...(paid !== undefined ? { paidReferralsCount: paid } : {}),
    ...(gc !== undefined ? { totalGcPaidToInfluencers: gc } : {}),
  };
};

/**
 * Accepts flat fields, nested `influencerProgram`, optional `platformSummary`, scoped
 * `totalInfluencers` / `totalPaidReferrals`, and `influencers[]`.
 */
export const normalizeInfluencerStatisticsData = (raw: unknown): InfluencerStatisticsData => {
  const empty: InfluencerStatisticsData = {
    influencerAccounts: 0,
    paidReferralsCount: 0,
    totalGcPaidToInfluencers: 0,
    influencers: [],
  };
  if (!raw || typeof raw !== 'object') {
    return empty;
  }
  const o = raw as Record<string, unknown>;
  const nested =
    o.influencerProgram && typeof o.influencerProgram === 'object'
      ? (o.influencerProgram as Record<string, unknown>)
      : o;

  const platformRaw =
    o.platformSummary && typeof o.platformSummary === 'object'
      ? (o.platformSummary as Record<string, unknown>)
      : undefined;
  const platformSummary: InfluencerStatisticsPlatformSummary | undefined =
    platformRaw &&
    (parseFiniteNumber(platformRaw.totalInfluencers) !== undefined ||
      parseFiniteNumber(platformRaw.totalPaidReferrals) !== undefined)
      ? {
          totalInfluencers: parseFiniteNumber(platformRaw.totalInfluencers) ?? 0,
          totalPaidReferrals: parseFiniteNumber(platformRaw.totalPaidReferrals) ?? 0,
        }
      : undefined;

  let influencers: InfluencerStatisticsRow[] = [];
  if (Array.isArray(o.influencers)) {
    influencers = o.influencers
      .map((item, i) => mapInfluencerRow(item, i))
      .filter((row): row is InfluencerStatisticsRow => row !== null);
  }

  const influencerAccounts =
    parseFiniteNumber(o.totalInfluencers) ??
    parseFiniteNumber(nested.influencerAccounts) ??
    parseFiniteNumber(o.influencerAccounts) ??
    0;
  const paidReferralsCount =
    parseFiniteNumber(o.totalPaidReferrals) ??
    parseFiniteNumber(nested.paidReferralsCount) ??
    parseFiniteNumber(o.paidReferralsCount) ??
    0;
  const totalGcPaidToInfluencers =
    parseFiniteNumber(o.totalGcPaidToInfluencers) ??
    parseFiniteNumber(nested.totalGcPaidToInfluencers) ??
    0;

  return {
    influencerAccounts,
    paidReferralsCount,
    totalGcPaidToInfluencers,
    ...(platformSummary ? { platformSummary } : {}),
    influencers,
  };
};

const buildStatisticsQueryParams = (params?: GetInfluencerStatisticsParams): Record<string, string> => {
  if (!params) {
    return {};
  }
  const q: Record<string, string> = {};
  const entries: [keyof GetInfluencerStatisticsParams, string][] = [
    ['email', params.email?.trim() ?? ''],
    ['id', params.id?.trim() ?? ''],
    ['date', params.date?.trim() ?? ''],
    ['fromDate', params.fromDate?.trim() ?? ''],
    ['toDate', params.toDate?.trim() ?? ''],
  ];
  for (const [key, value] of entries) {
    if (value) {
      q[key] = value;
    }
  }
  return q;
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
  getInfluencerStatistics: async (
    params?: GetInfluencerStatisticsParams
  ): Promise<InfluencerStatisticsData> => {
    const queryParams = buildStatisticsQueryParams(params);
    const response = await apiClient.get<InfluencerStatisticsResponse>(
      '/api/admin/influencers/statistics',
      Object.keys(queryParams).length > 0 ? { params: queryParams } : {}
    );
    return normalizeInfluencerStatisticsData(response.data?.data);
  },
};
