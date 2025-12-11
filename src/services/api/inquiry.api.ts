import apiClient from './client';
import type { InquiryRequest, InquiryResponse } from '../types/api.types';

export const inquiryApi = {
  /**
   * Submit a contact form inquiry
   * No authentication required
   */
  submitInquiry: async (data: InquiryRequest): Promise<InquiryResponse> => {
    const response = await apiClient.post<{ message: string }>('/api/inquiry', data);
    return {
      message: response.data.message || 'Your inquiry has been submitted successfully.',
      success: true,
    };
  },
};
