import { apolloClient } from './graphql/client';
import {
  GET_HOST_APPLICATIONS_QUERY,
  APPROVE_APPLICATION_MUTATION,
  REJECT_APPLICATION_MUTATION,
  GET_ALL_HOSTS_WITH_ASSIGNMENTS_QUERY,
  ASSIGN_HOST_MUTATION,
  GET_HOST_STATISTICS_QUERY,
  CREATE_HOST_MUTATION,
  GET_ALL_HOSTS_QUERY,
} from './graphql/queries';

export interface HostApplication {
  _id: string;
  id?: string; // For backward compatibility
  tournamentId: string;
  userId: string;
  user?: {
    name?: string;
    email?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface HostApplicationsListResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    applications: HostApplication[];
    total?: number;
  };
}

export interface ApproveRejectResponse {
  status: number;
  success: boolean;
  message: string;
  data?: HostApplication;
}

export interface HostAssignment {
  tournamentId: string;
  tournamentDate: string;
  tournamentStartTime: string;
  tournamentGame?: string;
  tournamentMode?: string;
  tournamentSubMode?: string;
}

export interface HostWithAssignments {
  hostId: string;
  name?: string;
  email?: string;
  assignedLobbies: HostAssignment[];
  totalLobbies: number;
  hasTimeConflict?: boolean;
  timeConflictDetails?: HostAssignment[] | null;
}

export interface HostsListResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    tournament?: {
      tournamentId: string;
      date: string;
      startTime: string;
      game: string;
      mode: string;
      subMode: string;
    };
    hosts: HostWithAssignments[];
    total?: number;
  };
}

export interface AssignHostRequest {
  tournamentId: string;
  hostId: string;
}

export interface AssignHostResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    tournament?: unknown;
    warnings?: string[];
    conflicts?: HostAssignment[];
  };
}

export interface DailyRecord {
  date: string;
  lobbies: number;
  tournaments?: Array<{
    tournamentId: string;
    date: string;
    startTime: string;
    game?: string;
    mode?: string;
    subMode?: string;
  }>;
}

export interface HostStatistics {
  hostId: string;
  name: string;
  email: string;
  totalLobbies: number;
  timeSlotSummary: Record<string, number>;
  dailyRecords: DailyRecord[];
}

export interface HostStatisticsResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    totalHosts: number;
    totalLobbies: number;
    filters: {
      date?: string;
      fromDate?: string;
      toDate?: string;
      hostId?: string;
    };
    hosts: HostStatistics[];
  };
}

export interface GetHostStatisticsParams {
  date?: string; // YYYY-MM-DD
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  hostId?: string;
}

export interface CreateHostRequest {
  email: string;
  name: string;
  password: string;
}

export interface CreateHostResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    hostId?: string;
    email?: string;
    name?: string;
  };
}

export interface Host {
  _id?: string;
  hostId?: string;
  email: string;
  name: string;
  role?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  totalLobbies?: number;
}

export interface HostsListAllResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    hosts: Host[];
    total?: number;
  };
}

export const hostApplicationsApi = {
  /**
   * Get host applications for a tournament (Admin only)
   * @param tournamentId - Tournament ID to get applications for
   */
  getHostApplications: async (tournamentId: string): Promise<HostApplication[]> => {
    const response = await apolloClient.query<{
      hostApplications: {
        applications: HostApplication[];
        total?: number;
      };
    }>({
      query: GET_HOST_APPLICATIONS_QUERY,
      variables: {
        input: { tournamentId },
      },
      fetchPolicy: 'network-only',
    });
    
    if (response.data?.hostApplications?.applications && Array.isArray(response.data.hostApplications.applications)) {
      return response.data.hostApplications.applications.map((app) => ({
        ...app,
        id: app._id || app.id,
      }));
    }
    
    return [];
  },

  /**
   * Approve host application (Admin only)
   * @param applicationId - Application ID to approve
   */
  approveApplication: async (applicationId: string): Promise<ApproveRejectResponse> => {
    const response = await apolloClient.mutate<{ approveApplication: ApproveRejectResponse }>({
      mutation: APPROVE_APPLICATION_MUTATION,
      variables: {
        input: { applicationId },
      },
    });
    return response.data?.approveApplication || { status: 200, success: true, message: '' };
  },

  /**
   * Reject host application (Admin only)
   * @param applicationId - Application ID to reject
   */
  rejectApplication: async (applicationId: string): Promise<ApproveRejectResponse> => {
    const response = await apolloClient.mutate<{ rejectApplication: ApproveRejectResponse }>({
      mutation: REJECT_APPLICATION_MUTATION,
      variables: {
        input: { applicationId },
      },
    });
    return response.data?.rejectApplication || { status: 200, success: true, message: '' };
  },

  /**
   * Get all hosts with their assignments for a tournament (Admin only)
   * @param tournamentId - Tournament ID to get hosts for
   */
  getAllHostsWithAssignments: async (tournamentId: string): Promise<HostWithAssignments[]> => {
    const response = await apolloClient.query<{
      hostsWithAssignments: {
        tournament?: {
          tournamentId: string;
          date: string;
          startTime: string;
          game: string;
          mode: string;
          subMode: string;
        };
        hosts: HostWithAssignments[];
        total?: number;
      };
    }>({
      query: GET_ALL_HOSTS_WITH_ASSIGNMENTS_QUERY,
      variables: {
        input: { tournamentId },
      },
      fetchPolicy: 'network-only',
    });
    
    if (response.data?.hostsWithAssignments?.hosts && Array.isArray(response.data.hostsWithAssignments.hosts)) {
      return response.data.hostsWithAssignments.hosts.map(host => ({
        ...host,
        assignedLobbies: Array.isArray(host.assignedLobbies) ? host.assignedLobbies : [],
        totalLobbies: host.totalLobbies || 0,
        hasTimeConflict: host.hasTimeConflict || false,
        timeConflictDetails: host.timeConflictDetails || null,
      }));
    }
    
    return [];
  },

  /**
   * Assign host to tournament directly (Admin only)
   * @param data - Assignment data (tournamentId and hostId)
   */
  assignHost: async (data: AssignHostRequest): Promise<AssignHostResponse> => {
    const response = await apolloClient.mutate<{ assignHost: AssignHostResponse }>({
      mutation: ASSIGN_HOST_MUTATION,
      variables: {
        input: data,
      },
    });
    return response.data?.assignHost || { status: 200, success: true, message: '' };
  },

  /**
   * Get host statistics and daily records (Admin only)
   * @param params - Query parameters for filtering statistics
   */
  getHostStatistics: async (params?: GetHostStatisticsParams): Promise<HostStatisticsResponse['data']> => {
    const response = await apolloClient.query<{
      hostStatistics: HostStatisticsResponse['data'];
    }>({
      query: GET_HOST_STATISTICS_QUERY,
      variables: {
        input: {
          date: params?.date || undefined,
          fromDate: params?.fromDate || undefined,
          toDate: params?.toDate || undefined,
          hostId: params?.hostId || undefined,
        },
      },
      fetchPolicy: 'network-only',
    });

    return response.data?.hostStatistics || {
      totalHosts: 0,
      totalLobbies: 0,
      filters: {},
      hosts: [],
    };
  },

  /**
   * Create a new host account (Admin only)
   * @param data - Host creation data (email, name, password)
   */
  createHost: async (data: CreateHostRequest): Promise<CreateHostResponse> => {
    const response = await apolloClient.mutate<{ createHost: CreateHostResponse }>({
      mutation: CREATE_HOST_MUTATION,
      variables: {
        input: data,
      },
    });
    return response.data?.createHost || { status: 200, success: true, message: '' };
  },

  /**
   * Get all hosts (Admin only)
   */
  getAllHosts: async (): Promise<Host[]> => {
    const response = await apolloClient.query<{
      hosts: {
        hosts: Host[];
        total?: number;
      };
    }>({
      query: GET_ALL_HOSTS_QUERY,
      fetchPolicy: 'network-only',
    });
    
    if (response.data?.hosts?.hosts && Array.isArray(response.data.hosts.hosts)) {
      return response.data.hosts.hosts.map(host => ({
        ...host,
        hostId: host._id || host.hostId,
      }));
    }
    
    return [];
  },
};

