import type { RawAxiosRequestHeaders } from 'axios';
import apiClient from './client';

/** Populated owner from GET /organizations when `ownerUserId` is expanded. */
export interface OrganizationOwnerUser {
  _id?: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  logoUrl?: string;
  ownerUserId?: string | OrganizationOwnerUser;
  createdAt?: string;
}

export const getOrganizationOwnerEmail = (org: AdminOrganization): string | undefined => {
  const o = org.ownerUserId;
  if (typeof o === 'object' && o !== null && typeof o.email === 'string' && o.email.length > 0) {
    return o.email;
  }
  return undefined;
};

/** One-line hint for list rows: email, name, id, or raw string id. */
export const getOrganizationOwnerSummary = (org: AdminOrganization): string | undefined => {
  const o = org.ownerUserId;
  if (o === undefined || o === null) {
    return undefined;
  }
  if (typeof o === 'string') {
    return o.length > 0 ? o : undefined;
  }
  if (typeof o.email === 'string' && o.email.length > 0) {
    return o.email;
  }
  if (typeof o.name === 'string' && o.name.length > 0) {
    return o.name;
  }
  if (typeof o._id === 'string' && o._id.length > 0) {
    return o._id;
  }
  return undefined;
};

export interface CreateOrganizationRequest {
  name: string;
  logoUrl: string;
  /** Owner account identified by email (sent instead of user id). */
  ownerEmail: string;
}

export interface CreateOrganizationResponse {
  status?: number;
  success?: boolean;
  message?: string;
  data?: unknown;
}

export type OrgTournamentStatusFilter =
  | 'upcoming'
  | 'locked'
  | 'running'
  | 'result_pending'
  | 'completed'
  | 'result_published'
  | 'cancelled';

/** Tournament row from GET /api/admin/organizations/:orgId/tournaments */
export interface OrgTournament {
  _id?: string;
  id?: string;
  tournamentId?: string;
  game?: string;
  mode?: string;
  subMode?: string;
  lobbyName?: string;
  date?: string;
  startTime?: string;
  status?: string;
  entryFee?: number;
  maxPlayers?: number;
  createdAt?: string;
}

export interface OrgTournamentStreamPayload {
  type?: string;
  orgId?: string;
  tournamentId?: string;
  orgtourment?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const pickOrgId = (raw: Record<string, unknown>): string => {
  const candidates = [raw._id, raw.id, raw.orgId];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) {
      return c;
    }
  }
  return '';
};

const normalizeOwnerUserId = (raw: unknown): string | OrganizationOwnerUser | undefined => {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw === 'string') {
    return raw.length > 0 ? raw : undefined;
  }
  if (!isRecord(raw)) {
    return undefined;
  }
  const email = typeof raw.email === 'string' ? raw.email : undefined;
  const name = typeof raw.name === 'string' ? raw.name : undefined;
  const role = typeof raw.role === 'string' ? raw.role : undefined;
  const nestedId = typeof raw._id === 'string' ? raw._id : undefined;
  if (!email && !name && !role && !nestedId) {
    return undefined;
  }
  return {
    ...(nestedId !== undefined ? { _id: nestedId } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(role !== undefined ? { role } : {}),
  };
};

const normalizeOrganization = (raw: Record<string, unknown>): AdminOrganization => ({
  id: pickOrgId(raw),
  name: typeof raw.name === 'string' ? raw.name : '',
  logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl : undefined,
  ownerUserId: normalizeOwnerUserId(raw.ownerUserId),
  createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
});

const extractOrganizationsArray = (body: unknown): unknown[] => {
  if (Array.isArray(body)) {
    return body;
  }
  if (!isRecord(body)) {
    return [];
  }
  const data = body.data;
  if (Array.isArray(data)) {
    return data;
  }
  if (isRecord(data)) {
    if (Array.isArray(data.organizations)) {
      return data.organizations;
    }
    if (Array.isArray(data.items)) {
      return data.items;
    }
  }
  return [];
};

const extractTournamentsArray = (body: unknown): unknown[] => {
  if (Array.isArray(body)) {
    return body;
  }
  if (!isRecord(body)) {
    return [];
  }
  const data = body.data;
  if (Array.isArray(data)) {
    return data;
  }
  if (isRecord(data)) {
    if (Array.isArray(data.tournaments)) {
      return data.tournaments;
    }
    if (Array.isArray(data.items)) {
      return data.items;
    }
  }
  return [];
};

/** Parsed public URL for the uploaded image (backend-specific shape). */
const parseUploadImageUrl = (payload: unknown): string => {
  if (typeof payload === 'string' && /^https?:\/\//i.test(payload.trim())) {
    return payload.trim();
  }
  if (!isRecord(payload)) {
    throw new Error('Invalid upload response: expected JSON with a URL');
  }
  const direct =
    (typeof payload.url === 'string' && payload.url) ||
    (typeof payload.imageUrl === 'string' && payload.imageUrl) ||
    (typeof payload.logoUrl === 'string' && payload.logoUrl) ||
    (typeof payload.fileUrl === 'string' && payload.fileUrl);
  if (direct) {
    return direct;
  }
  const data = payload.data;
  if (typeof data === 'string' && /^https?:\/\//i.test(data)) {
    return data;
  }
  if (isRecord(data)) {
    const nested =
      (typeof data.url === 'string' && data.url) ||
      (typeof data.imageUrl === 'string' && data.imageUrl);
    if (nested) {
      return nested;
    }
  }
  throw new Error('Upload response did not include an image URL');
};

const normalizeOrgTournament = (raw: Record<string, unknown>): OrgTournament => ({
  _id: typeof raw._id === 'string' ? raw._id : undefined,
  id: typeof raw.id === 'string' ? raw.id : undefined,
  tournamentId: typeof raw.tournamentId === 'string' ? raw.tournamentId : undefined,
  game: typeof raw.game === 'string' ? raw.game : undefined,
  mode: typeof raw.mode === 'string' ? raw.mode : undefined,
  subMode: typeof raw.subMode === 'string' ? raw.subMode : undefined,
  lobbyName: typeof raw.lobbyName === 'string' ? raw.lobbyName : undefined,
  date: typeof raw.date === 'string' ? raw.date : undefined,
  startTime: typeof raw.startTime === 'string' ? raw.startTime : undefined,
  status: typeof raw.status === 'string' ? raw.status : undefined,
  entryFee: typeof raw.entryFee === 'number' ? raw.entryFee : undefined,
  maxPlayers: typeof raw.maxPlayers === 'number' ? raw.maxPlayers : undefined,
  createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
});

/**
 * Admin image upload for org logos.
 * POST multipart field `file`. Change path/field if your API differs.
 */
const ORG_LOGO_UPLOAD_PATH = '/api/admin/upload/image';

export const organizationsApi = {
  /**
   * Upload a logo image; returns a public URL for `logoUrl` on create organization.
   */
  uploadOrgLogoImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // Omit Content-Type so the browser/axios sets multipart with boundary (instance default is JSON).
    const response = await apiClient.post<unknown>(ORG_LOGO_UPLOAD_PATH, formData, {
      headers: {
        'Content-Type': undefined,
      } as RawAxiosRequestHeaders,
    });
    return parseUploadImageUrl(response.data);
  },

  getOrganizations: async (): Promise<{ organizations: AdminOrganization[] }> => {
    const response = await apiClient.get<unknown>('/api/admin/organizations');
    const list = extractOrganizationsArray(response.data);
    const organizations = list
      .filter(isRecord)
      .map(normalizeOrganization)
      .filter((org) => org.id.length > 0);
    return { organizations };
  },

  createOrganization: async (data: CreateOrganizationRequest): Promise<CreateOrganizationResponse> => {
    const response = await apiClient.post<CreateOrganizationResponse>('/api/admin/organizations', data);
    return response.data;
  },

  getOrgTournaments: async (
    orgId: string,
    status?: OrgTournamentStatusFilter
  ): Promise<{ tournaments: OrgTournament[] }> => {
    const params = status ? { status } : undefined;
    const response = await apiClient.get<unknown>(
      `/api/admin/organizations/${encodeURIComponent(orgId)}/tournaments`,
      { params }
    );
    const list = extractTournamentsArray(response.data);
    const tournaments = list.filter(isRecord).map(normalizeOrgTournament);
    return { tournaments };
  },
};
