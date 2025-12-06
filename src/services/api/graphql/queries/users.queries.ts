import { gql } from '@apollo/client';

// Get Users Query
export const GET_USERS_QUERY = gql`
  query GetUsers($input: GetUsersInput) {
    users(input: $input) {
      users {
        _id
        userId
        email
        name
        role
        isEmailVerified
        createdAt
        updatedAt
        authProvider
        isBlocked
        roomIds
        balanceGC
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;

// Block Users Mutation
export const BLOCK_USERS_MUTATION = gql`
  mutation BlockUsers($input: BlockUsersInput!) {
    blockUsers(input: $input) {
      status
      success
      message
      data {
        blocked
      }
    }
  }
`;

// Unblock Users Mutation
export const UNBLOCK_USERS_MUTATION = gql`
  mutation UnblockUsers($input: UnblockUsersInput!) {
    unblockUsers(input: $input) {
      status
      success
      message
      data {
        unblocked
      }
    }
  }
`;

// Top Up Balance Mutation
export const TOP_UP_BALANCE_MUTATION = gql`
  mutation TopUpBalance($input: TopUpBalanceInput!) {
    topUpBalance(input: $input) {
      status
      success
      message
      data {
        balanceGC
      }
    }
  }
`;

// Bulk Top Up Balance Mutation
export const BULK_TOP_UP_BALANCE_MUTATION = gql`
  mutation BulkTopUpBalance($input: BulkTopUpBalanceInput!) {
    bulkTopUpBalance(input: $input) {
      status
      success
      message
      data {
        successCount
        failedCount
        results {
          userId
          success
          balanceGC
          error
        }
      }
    }
  }
`;

// Get Top Up Transactions Query
export const GET_TOP_UP_TRANSACTIONS_QUERY = gql`
  query GetTopUpTransactions($input: GetTopUpTransactionsInput) {
    topUpTransactions(input: $input) {
      transactions {
        _id
        userId
        amountGC
        status
        description
        createdAt
        updatedAt
      }
      total
    }
  }
`;

