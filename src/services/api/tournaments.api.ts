import apiClient from './client';

export interface Tournament {
  _id: string;
  id?: string; // For backward compatibility
  game: string;
  mode: string;
  subMode: string;
  entryFee: number;
  maxPlayers: number;
  availableSlots?: number;
  joinedCount?: number;
  date: string; // ISO format or YYYY-MM-DD
  startTime: string;
  lockTime: string;
  participants: unknown[];
  hostId: string | null;
  room: {
    roomId: string | null;
    password: string | null;
  };
  prizePool: number;
  status: 'upcoming' | 'live' | 'completed';
  results: Array<{
    userId: string;
  }>;
  region?: string;
  createdAt?: string;
  updatedAt?: string;
  maxTeams?: number;
  joinedTeams?: number;
  availableTeams?: number;
  playersPerTeam?: number;
}

export interface TournamentsListResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    status?: string;
    total?: number;
    tournaments: Tournament[];
  };
}

export interface GetTournamentsParams {
  status?: 'upcoming' | 'live' | 'completed';
  fromDate?: string; // YYYY-MM-DD format, for upcoming only
}

export interface UpdateTournamentRequest {
  date?: string; // YYYY-MM-DD format
  startTime?: string;
  entryFee?: number;
  maxPlayers?: number;
  region?: string;
}

export interface UpdateTournamentResponse {
  status: number;
  success: boolean;
  message: string;
  data?: Tournament;
}

export interface DeleteTournamentResponse {
  status: number;
  success: boolean;
  message: string;
}

export interface UpdateRoomRequest {
  tournamentId: string;
  roomId: string;
  password: string;
}

export interface UpdateRoomResponse {
  status: number;
  success: boolean;
  message: string;
  data?: Tournament;
}

export interface JoinTournamentRequest {
  tournamentId: string;
}

export interface JoinTournamentResponse {
  status: number;
  success: boolean;
  message: string;
  data?: Tournament;
}

export interface JoinedTournamentsResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    tournaments: Tournament[];
  };
}

export const tournamentsApi = {
  /**
   * Get tournaments list (Admin only)
   * @param params - Query parameters for filtering tournaments
   */
  getTournaments: async (params?: GetTournamentsParams): Promise<Tournament[]> => {
    const queryParams: Record<string, string> = {};
    
    if (params?.status) {
      queryParams.status = params.status;
    }
    
    if (params?.fromDate) {
      queryParams.fromDate = params.fromDate;
    }
    
    const response = await apiClient.get<TournamentsListResponse>('/api/admin/tournaments', {
      params: queryParams,
    });
    
    if (response.data?.data?.tournaments && Array.isArray(response.data.data.tournaments)) {
      // Map _id to id for consistency, and format date if needed
      return response.data.data.tournaments.map((tournament) => ({
        ...tournament,
        id: tournament._id || tournament.id,
      }));
    }
    
    return [];
  },

  /**
   * Get tournaments list for users
   * @param params - Query parameters for filtering tournaments by status
   */
  getUserTournaments: async (params?: { status?: string }): Promise<Tournament[]> => {
    const queryParams: Record<string, string> = {};
    
    if (params?.status) {
      queryParams.status = params.status;
    }
    
    const response = await apiClient.get<TournamentsListResponse>('/api/tournament/list', {
      params: queryParams,
    });
    
    if (response.data?.data?.tournaments && Array.isArray(response.data.data.tournaments)) {
      // Map _id to id for consistency
      return response.data.data.tournaments.map((tournament) => ({
        ...tournament,
        id: tournament._id || tournament.id,
      }));
    }
    
    return [];
  },

  /**
   * Update tournament (Admin only)
   * @param tournamentId - Tournament ID to update
   * @param data - Tournament data to update
   */
  updateTournament: async (tournamentId: string, data: UpdateTournamentRequest): Promise<UpdateTournamentResponse> => {
    const response = await apiClient.put<UpdateTournamentResponse>(`/api/admin/tournaments/${tournamentId}`, data);
    return response.data;
  },

  /**
   * Delete tournament (Admin only)
   * @param tournamentId - Tournament ID to delete
   */
  deleteTournament: async (tournamentId: string): Promise<DeleteTournamentResponse> => {
    const response = await apiClient.delete<DeleteTournamentResponse>(`/api/admin/tournaments/${tournamentId}`);
    return response.data;
  },

  /**
   * Update room information for a tournament (Admin only)
   * @param tournamentId - Tournament ID to update room for
   * @param data - Room data (roomId and password)
   */
  updateRoom: async (tournamentId: string, data: Omit<UpdateRoomRequest, 'tournamentId'>): Promise<UpdateRoomResponse> => {
    const response = await apiClient.post<UpdateRoomResponse>(`/api/admin/tournaments/${tournamentId}/update-room`, data);
    return response.data;
  },

  /**
   * Update room information for a tournament (Host or Admin only)
   * @param data - Room data including tournamentId, roomId and password
   */
  updateRoomForUser: async (data: UpdateRoomRequest): Promise<UpdateRoomResponse> => {
    const response = await apiClient.post<UpdateRoomResponse>('/api/tournament/update-room', data);
    return response.data;
  },

  /**
   * Join a tournament (User only)
   * @param data - Tournament ID to join
   */
  joinTournament: async (data: JoinTournamentRequest): Promise<JoinTournamentResponse> => {
    const response = await apiClient.post<JoinTournamentResponse>('/api/tournament/join', data);
    return response.data;
  },

  /**
   * Get tournaments that the user has joined (User only)
   */
  getJoinedTournaments: async (): Promise<Tournament[]> => {
    const response = await apiClient.get<JoinedTournamentsResponse>('/api/tournament/joined');
    
    if (response.data?.data?.tournaments && Array.isArray(response.data.data.tournaments)) {
      return response.data.data.tournaments.map((tournament) => ({
        ...tournament,
        id: tournament._id || tournament.id,
      }));
    }
    
    return [];
  },
};

