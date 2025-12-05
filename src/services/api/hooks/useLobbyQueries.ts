import { useMutation } from '@tanstack/react-query';
import { lobbyApi, type GenerateLobbyRequest } from '../index';

/**
 * Hook for generating lobbies mutation
 */
export const useGenerateLobbies = () => {
  return useMutation({
    mutationFn: (data: GenerateLobbyRequest) => lobbyApi.generateLobbies(data),
  });
};

