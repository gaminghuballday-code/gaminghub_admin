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

export const hostApi = {
  /**
   * Get tournaments assigned to the current host (Host only)
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
};


