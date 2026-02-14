import apiClient from './client';
import type {
  Tournament,
  UpdateRoomRequest,
  UpdateRoomResponse,
  JoinedTournamentsResponse,
} from './tournaments.api';
import type { HostApplication, HostApplicationsListResponse } from './hostApplications.api';

export interface HostTournamentsResponse extends JoinedTournamentsResponse {
  // Same shape as JoinedTournamentsResponse:
  // { status, success, message, data: { tournaments: Tournament[] } }
}

export interface ApplyHostResponse {
  status: number;
  success: boolean;
  message: string;
  data?: unknown;
}

/** Response shape for GET /api/host/my-lobbies - lobbies grouped by status */
export interface HostMyLobbiesResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    lobbies?: {
      upcoming?: Tournament[];
      live?: Tournament[];
      resultPending?: Tournament[];
      pendingResult?: Tournament[];
      completed?: Tournament[];
    };
  };
}

export const hostApi = {
  /**
   * Get host's assigned lobbies grouped by status (upcoming, live, resultPending, completed)
   * For lobby section - shows all tournaments assigned to this host
   */
  getHostMyLobbies: async (): Promise<Tournament[]> => {
    const response = await apiClient.get<HostMyLobbiesResponse>('/api/host/my-lobbies');

    const lobbies = response.data?.data?.lobbies;
    if (!lobbies) return [];

    const flatten = (arr: Tournament[] | undefined): Tournament[] =>
      Array.isArray(arr) ? arr : [];

    const all = [
      ...flatten(lobbies.upcoming),
      ...flatten(lobbies.live),
      ...flatten(lobbies.resultPending ?? lobbies.pendingResult),
      ...flatten(lobbies.completed),
    ];

    return all.map((t) => ({
      ...t,
      _id: t._id,
      id: t._id || t.id,
    }));
  },

  /**
   * Get tournaments assigned to the current host (Host only) - legacy
   */
  getHostTournaments: async (): Promise<Tournament[]> => {
    const response = await apiClient.get<HostTournamentsResponse>('/api/host/tournaments');

    if (response.data?.data?.tournaments && Array.isArray(response.data.data.tournaments)) {
      return response.data.data.tournaments.map((tournament) => ({
        ...tournament,
        id: tournament._id || tournament.id,
      }));
    }

    return [];
  },

  /**
   * Apply to host a tournament (Host only)
   * @param tournamentId - Tournament ID to apply for
   */
  applyForHostTournament: async (tournamentId: string): Promise<ApplyHostResponse> => {
    const response = await apiClient.post<ApplyHostResponse>(
      `/api/host/tournaments/${tournamentId}/apply`
    );
    return response.data;
  },

  /**
   * Update room information for a tournament as Host
   * @param tournamentId - Tournament ID to update room for
   * @param data - Room data (roomId and password)
   */
  updateHostRoom: async (
    tournamentId: string,
    data: Omit<UpdateRoomRequest, 'tournamentId'>
  ): Promise<UpdateRoomResponse> => {
    const response = await apiClient.post<UpdateRoomResponse>(
      `/api/host/tournaments/${tournamentId}/update-room`,
      data
    );
    return response.data;
  },

  /**
   * Get current host's own applications (Host only)
   */
  getOwnApplications: async (): Promise<HostApplication[]> => {
    const response = await apiClient.get<HostApplicationsListResponse>('/api/host/applications');

    if (response.data?.data?.applications && Array.isArray(response.data.data.applications)) {
      return response.data.data.applications.map((app) => ({
        ...app,
        id: app._id || app.id,
      }));
    }

    return [];
  },

  /**
   * Get available tournaments with host application status (Host only)
   * @param status - Optional status filter (upcoming, live, completed, cancelled)
   */
  getAvailableTournaments: async (status?: string): Promise<Tournament[]> => {
    const params: Record<string, string> = {};
    if (status) {
      params.status = status;
    }
    
    const response = await apiClient.get<HostTournamentsResponse>('/api/host/tournaments/available', {
      params,
    });

    if (response.data?.data?.tournaments && Array.isArray(response.data.data.tournaments)) {
      return response.data.data.tournaments.map((tournament) => ({
        ...tournament,
        id: tournament._id || tournament.id,
      }));
    }

    return [];
  },

  /**
   * End room for a tournament (Host only) - Changes status to pendingResult
   * @param tournamentId - Tournament ID to end room for
   */
  endRoom: async (tournamentId: string): Promise<UpdateRoomResponse> => {
    const response = await apiClient.post<UpdateRoomResponse>(
      `/api/host/tournaments/${tournamentId}/end-room`
    );
    return response.data;
  },

  /**
   * Declare results for a tournament (Host only)
   * @param tournamentId - Tournament ID to declare results for
   * @param formData - FormData containing screenshots and match results
   */
  declareResults: async (tournamentId: string, formData: FormData): Promise<UpdateRoomResponse> => {
    const response = await apiClient.post<UpdateRoomResponse>(
      `/api/host/tournaments/${tournamentId}/declare-results`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};


