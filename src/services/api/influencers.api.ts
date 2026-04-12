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

export const influencersApi = {
  invite: async (data: InviteInfluencerRequest): Promise<InviteInfluencerResponse> => {
    const response = await apiClient.post<InviteInfluencerResponse>(
      '/api/admin/influencers/invite',
      data
    );
    return response.data;
  },
};
