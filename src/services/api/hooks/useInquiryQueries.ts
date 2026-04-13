import { useMutation } from '@tanstack/react-query';
import { inquiryApi } from '../inquiry.api';
import type { InquiryRequest } from '../../types/api.types';

export const inquiryMutationKeys = {
  all: ['inquiry'] as const,
  submit: () => [...inquiryMutationKeys.all, 'submit'] as const,
};

/**
 * Public inquiry form — POST /api/inquiry (no auth).
 */
export const useSubmitInquiry = () => {
  return useMutation({
    mutationKey: inquiryMutationKeys.submit(),
    mutationFn: (data: InquiryRequest) => inquiryApi.submitInquiry(data),
  });
};
