import { apolloClient } from './graphql/client';
import {
  GET_TOURNAMENTS_QUERY,
  UPDATE_TOURNAMENT_MUTATION,
  DELETE_TOURNAMENT_MUTATION,
  UPDATE_ROOM_MUTATION,
} from './graphql/queries';

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
  roomId: string;
  password: string;
}

export interface UpdateRoomResponse {
  status: number;
  success: boolean;
  message: string;
  data?: Tournament;
}

export const tournamentsApi = {
  /**
   * Get tournaments list (Admin only)
   * @param params - Query parameters for filtering tournaments
   */
  getTournaments: async (params?: GetTournamentsParams): Promise<Tournament[]> => {
    const response = await apolloClient.query<{
      tournaments: {
        tournaments: Tournament[];
        total?: number;
      };
    }>({
      query: GET_TOURNAMENTS_QUERY,
      variables: {
        filters: {
          status: params?.status || undefined,
          fromDate: params?.fromDate || undefined,
        },
      },
      fetchPolicy: 'network-only',
    });
    
    if (response.data?.tournaments?.tournaments && Array.isArray(response.data.tournaments.tournaments)) {
      return response.data.tournaments.tournaments.map((tournament) => ({
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
    const response = await apolloClient.mutate<{ updateTournament: UpdateTournamentResponse }>({
      mutation: UPDATE_TOURNAMENT_MUTATION,
      variables: {
        input: {
          tournamentId,
          ...data,
        },
      },
    });
    return response.data?.updateTournament || { status: 200, success: true, message: '' };
  },

  /**
   * Delete tournament (Admin only)
   * @param tournamentId - Tournament ID to delete
   */
  deleteTournament: async (tournamentId: string): Promise<DeleteTournamentResponse> => {
    const response = await apolloClient.mutate<{ deleteTournament: DeleteTournamentResponse }>({
      mutation: DELETE_TOURNAMENT_MUTATION,
      variables: {
        input: { tournamentId },
      },
    });
    return response.data?.deleteTournament || { status: 200, success: true, message: '' };
  },

  /**
   * Update room information for a tournament (Admin only)
   * @param tournamentId - Tournament ID to update room for
   * @param data - Room data (roomId and password)
   */
  updateRoom: async (tournamentId: string, data: UpdateRoomRequest): Promise<UpdateRoomResponse> => {
    const response = await apolloClient.mutate<{ updateRoom: UpdateRoomResponse }>({
      mutation: UPDATE_ROOM_MUTATION,
      variables: {
        input: {
          tournamentId,
          roomId: data.roomId,
          password: data.password,
        },
      },
    });
    return response.data?.updateRoom || { status: 200, success: true, message: '' };
  },
};

