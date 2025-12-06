import { gql } from '@apollo/client';

// Login Mutation
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        _id
        email
        name
        role
        isEmailVerified
      }
      accessToken
      refreshToken
    }
  }
`;

// Logout Mutation
export const LOGOUT_MUTATION = gql`
  mutation Logout($input: LogoutInput) {
    logout(input: $input) {
      success
      message
    }
  }
`;

// Get Profile Query
export const GET_PROFILE_QUERY = gql`
  query GetProfile {
    profile {
      userId
      email
      name
      role
      isEmailVerified
    }
  }
`;

