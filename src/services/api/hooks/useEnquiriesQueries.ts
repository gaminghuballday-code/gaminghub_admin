import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  inquiryApi,
  type EnquiryReplyRequest,
  type CreateInquiryTemplateRequest,
  type UpdateInquiryTemplateRequest,
  type InquiryReplyFromTemplateBody,
} from '../index';

// Query keys
export const enquiriesKeys = {
  all: ['enquiries'] as const,
  lists: () => [...enquiriesKeys.all, 'list'] as const,
  list: (filters?: { page?: number; limit?: number; replied?: boolean; subject?: string }) =>
    [...enquiriesKeys.lists(), filters] as const,
};

export const enquiryTemplateKeys = {
  all: ['enquiry-templates'] as const,
  list: (includeInactive: boolean) =>
    [...enquiryTemplateKeys.all, 'list', { includeInactive }] as const,
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

export const useInquiryTemplates = (includeInactive: boolean, enabled = true) => {
  return useQuery({
    queryKey: enquiryTemplateKeys.list(includeInactive),
    queryFn: () => inquiryApi.getInquiryTemplates(includeInactive),
    enabled,
  });
};

export const useCreateInquiryTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInquiryTemplateRequest) => inquiryApi.createInquiryTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiryTemplateKeys.all });
    },
  });
};

export const useUpdateInquiryTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: UpdateInquiryTemplateRequest }) =>
      inquiryApi.updateInquiryTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiryTemplateKeys.all });
    },
  });
};

export const useDeleteInquiryTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => inquiryApi.deleteInquiryTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiryTemplateKeys.all });
    },
  });
};

export const useReplyToEnquiryFromTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inquiryId, body }: { inquiryId: string; body: InquiryReplyFromTemplateBody }) =>
      inquiryApi.replyToEnquiryFromTemplate(inquiryId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiriesKeys.lists() });
    },
  });
};
