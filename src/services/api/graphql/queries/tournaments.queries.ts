import { gql } from '@apollo/client';

// Get Tournaments Query
export const GET_TOURNAMENTS_QUERY = gql`
  query GetTournaments($filters: TournamentFiltersInput) {
    tournaments(filters: $filters) {
      tournaments {
        _id
        id
        game
        mode
        subMode
        entryFee
        maxPlayers
        availableSlots
        participantCount
        joinedCount
        date
        startTime
        lockTime
        participants
        hostId
        room {
          roomId
          password
        }
        prizePool
        status
        results {
          userId
        }
        region
        createdAt
        updatedAt
        maxTeams
        joinedTeams
        availableTeams
        playersPerTeam
      }
      total
    }
  }
`;

// Update Tournament Mutation
export const UPDATE_TOURNAMENT_MUTATION = gql`
  mutation UpdateTournament($input: UpdateTournamentInput!) {
    updateTournament(input: $input) {
      status
      success
      message
      data {
        _id
        id
        game
        mode
        subMode
        entryFee
        maxPlayers
        date
        startTime
        lockTime
        hostId
        room {
          roomId
          password
        }
        prizePool
        status
        region
      }
    }
  }
`;

// Delete Tournament Mutation
export const DELETE_TOURNAMENT_MUTATION = gql`
  mutation DeleteTournament($input: DeleteTournamentInput!) {
    deleteTournament(input: $input) {
      status
      success
      message
    }
  }
`;

// Update Room Mutation
export const UPDATE_ROOM_MUTATION = gql`
  mutation UpdateRoom($input: UpdateRoomInput!) {
    updateRoom(input: $input) {
      status
      success
      message
      data {
        _id
        id
        room {
          roomId
          password
        }
      }
    }
  }
`;

