import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inquiryApi, type EnquiryReplyRequest } from '../index';

// Query keys
export const enquiriesKeys = {
  all: ['enquiries'] as const,
  lists: () => [...enquiriesKeys.all, 'list'] as const,
  list: (filters?: { page?: number; limit?: number; replied?: boolean; subject?: string }) =>
    [...enquiriesKeys.lists(), filters] as const,
};

/**
 * Hook for fetching all enquiries (Admin only)
 */
export const useEnquiries = (
  params?: {
    page?: number;
    limit?: number;
    replied?: boolean;
    subject?: string;
  },
  enabled = true
) => {
  return useQuery({
    queryKey: enquiriesKeys.list(params),
    queryFn: () => inquiryApi.getAllEnquiries(params),
    enabled,
  });
};

/**
 * Hook for replying to an enquiry (Admin only)
 */
export const useReplyToEnquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EnquiryReplyRequest) => inquiryApi.replyToEnquiry(data),
    onSuccess: () => {
      // Invalidate enquiries list to refetch
      queryClient.invalidateQueries({ queryKey: enquiriesKeys.lists() });
    },
  });
};
