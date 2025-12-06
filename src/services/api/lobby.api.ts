import { apolloClient } from './graphql/client';
import { GENERATE_LOBBIES_MUTATION } from './graphql/queries';

export interface GenerateLobbyRequest {
  date: string; // Date string in ISO format (YYYY-MM-DD)
  timeSlots: string[];
  mode: string;
  subModes: string[];
  region: string;
  price: number;
}

export interface GenerateLobbyResponse {
  status: number;
  success: boolean;
  message: string;
  data?: unknown;
}

export const lobbyApi = {
  /**
   * Generate lobbies with custom parameters (Admin only)
   * @param request - Lobby generation parameters
   */
  generateLobbies: async (request: GenerateLobbyRequest): Promise<GenerateLobbyResponse> => {
    const response = await apolloClient.mutate<{ generateLobbies: GenerateLobbyResponse }>({
      mutation: GENERATE_LOBBIES_MUTATION,
      variables: {
        input: request,
      },
    });
    return response.data?.generateLobbies || { status: 200, success: true, message: '' };
  },
};

