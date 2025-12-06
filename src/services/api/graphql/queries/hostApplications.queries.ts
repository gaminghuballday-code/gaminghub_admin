import { gql } from '@apollo/client';

// Get Host Applications Query
export const GET_HOST_APPLICATIONS_QUERY = gql`
  query GetHostApplications($input: GetHostApplicationsInput!) {
    hostApplications(input: $input) {
      applications {
        _id
        id
        tournamentId
        userId
        user {
          name
          email
        }
        status
        createdAt
        updatedAt
      }
      total
    }
  }
`;

// Approve Application Mutation
export const APPROVE_APPLICATION_MUTATION = gql`
  mutation ApproveApplication($input: ApproveApplicationInput!) {
    approveApplication(input: $input) {
      status
      success
      message
      data {
        _id
        id
        tournamentId
        userId
        status
      }
    }
  }
`;

// Reject Application Mutation
export const REJECT_APPLICATION_MUTATION = gql`
  mutation RejectApplication($input: RejectApplicationInput!) {
    rejectApplication(input: $input) {
      status
      success
      message
      data {
        _id
        id
        tournamentId
        userId
        status
      }
    }
  }
`;

// Get All Hosts With Assignments Query
export const GET_ALL_HOSTS_WITH_ASSIGNMENTS_QUERY = gql`
  query GetAllHostsWithAssignments($input: GetHostsWithAssignmentsInput!) {
    hostsWithAssignments(input: $input) {
      tournament {
        tournamentId
        date
        startTime
        game
        mode
        subMode
      }
      hosts {
        hostId
        name
        email
        assignedLobbies {
          tournamentId
          tournamentDate
          tournamentStartTime
          tournamentGame
          tournamentMode
          tournamentSubMode
        }
        totalLobbies
        hasTimeConflict
        timeConflictDetails {
          tournamentId
          tournamentDate
          tournamentStartTime
        }
      }
      total
    }
  }
`;

// Assign Host Mutation
export const ASSIGN_HOST_MUTATION = gql`
  mutation AssignHost($input: AssignHostInput!) {
    assignHost(input: $input) {
      status
      success
      message
      data {
        tournament
        warnings
        conflicts {
          tournamentId
          tournamentDate
          tournamentStartTime
        }
      }
    }
  }
`;

// Get Host Statistics Query
export const GET_HOST_STATISTICS_QUERY = gql`
  query GetHostStatistics($input: GetHostStatisticsInput) {
    hostStatistics(input: $input) {
      totalHosts
      totalLobbies
      filters {
        date
        fromDate
        toDate
        hostId
      }
      hosts {
        hostId
        name
        email
        totalLobbies
        timeSlotSummary
        dailyRecords {
          date
          lobbies
          tournaments {
            tournamentId
            date
            startTime
            game
            mode
            subMode
          }
        }
      }
    }
  }
`;

// Create Host Mutation
export const CREATE_HOST_MUTATION = gql`
  mutation CreateHost($input: CreateHostInput!) {
    createHost(input: $input) {
      status
      success
      message
      data {
        hostId
        email
        name
      }
    }
  }
`;

// Get All Hosts Query
export const GET_ALL_HOSTS_QUERY = gql`
  query GetAllHosts {
    hosts {
      hosts {
        _id
        hostId
        email
        name
        role
        isEmailVerified
        createdAt
        updatedAt
        totalLobbies
      }
      total
    }
  }
`;

