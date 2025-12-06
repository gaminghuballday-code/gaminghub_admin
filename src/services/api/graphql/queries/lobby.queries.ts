import { gql } from '@apollo/client';

// Generate Lobbies Mutation
export const GENERATE_LOBBIES_MUTATION = gql`
  mutation GenerateLobbies($input: GenerateLobbiesInput!) {
    generateLobbies(input: $input) {
      status
      success
      message
      data
    }
  }
`;

