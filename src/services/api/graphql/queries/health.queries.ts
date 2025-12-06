import { gql } from '@apollo/client';

// Health Check Query
export const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    health {
      status
      timestamp
      uptime
    }
  }
`;

