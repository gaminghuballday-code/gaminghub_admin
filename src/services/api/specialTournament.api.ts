import apiClient from './client';

export type SpecialTournamentMode = 'BR' | 'CS' | 'LW';
export type SpecialTournamentSubMode = 'solo' | 'duo' | 'squad';

export interface CreateSpecialTournamentRequest {
  title: string;
  mode: SpecialTournamentMode;
  subMode: SpecialTournamentSubMode;
  prizePool: number;
  maxSlots: number;
  totalRounds: number;
}

export interface SpecialTournament {
  _id: string;
  id?: string;
  title: string;
  mode: SpecialTournamentMode | string;
  subMode: SpecialTournamentSubMode | string;
  prizePool: number;
  maxSlots: number;
  totalRounds: number;
  // API status: draft | published | running | completed | cancelled
  status?: 'draft' | 'published' | 'running' | 'completed' | 'cancelled' | string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface SpecialTournamentListParams {
  filter?: 'upcoming' | 'live' | 'completed';
  page?: number;
  limit?: number;
}

export interface SpecialTournamentsListResponse {
  status: number;
  success: boolean;
  message?: string;
  data?: {
    specialTournaments?: SpecialTournament[];
    tournaments?: SpecialTournament[];
    total?: number;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface SpecialTournamentPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateSpecialTournamentResponse {
  status: number;
  success: boolean;
  message?: string;
  data?: {
    specialTournament?: SpecialTournament;
    tournament?: SpecialTournament;
  };
}

export const specialTournamentApi = {
  create: async (payload: CreateSpecialTournamentRequest): Promise<CreateSpecialTournamentResponse> => {
    const response = await apiClient.post<CreateSpecialTournamentResponse>('/api/special-tournament/create', payload);
    return response.data;
  },

  list: async (
    params?: SpecialTournamentListParams
  ): Promise<{ tournaments: SpecialTournament[]; total?: number; pagination?: SpecialTournamentPagination }> => {
    const queryParams: Record<string, string> = {};

    if (params?.filter) queryParams.filter = params.filter;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();

    const response = await apiClient.get<SpecialTournamentsListResponse>('/api/special-tournament/list', { params: queryParams });

    const rawList =
      response.data?.data?.specialTournaments ||
      response.data?.data?.tournaments ||
      [];

    const tournaments = Array.isArray(rawList)
      ? rawList.map((t) => ({ ...t, id: t._id || t.id }))
      : [];

    return {
      tournaments,
      total: response.data?.data?.pagination?.totalItems || response.data?.data?.total || tournaments.length,
      pagination: response.data?.data?.pagination as SpecialTournamentPagination | undefined,
    };
  },
};

