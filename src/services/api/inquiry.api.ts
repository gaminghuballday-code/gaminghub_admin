import apiClient from './client';
import type { 
  InquiryRequest, 
  InquiryResponse,
  Enquiry,
  EnquiryReplyRequest,
  EnquiryReplyResponse,
  EnquiriesListResponse,
} from '../types/api.types';

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

  /**
   * Get all enquiries (Admin only)
   * @param params - Query parameters for filtering enquiries
   */
  getAllEnquiries: async (params?: {
    page?: number;
    limit?: number;
    replied?: boolean;
    subject?: string;
  }): Promise<{ enquiries: Enquiry[]; total?: number; pagination?: any }> => {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) {
      queryParams.page = params.page.toString();
    }
    if (params?.limit) {
      queryParams.limit = params.limit.toString();
    }
    if (params?.replied !== undefined) {
      queryParams.replied = params.replied.toString();
    }
    if (params?.subject) {
      queryParams.subject = params.subject;
    }

    const response = await apiClient.get<EnquiriesListResponse>(
      '/api/admin/inquiries',
      { params: queryParams }
    );

    if (response.data?.data?.enquiries && Array.isArray(response.data.data.enquiries)) {
      return {
        enquiries: response.data.data.enquiries.map((enquiry) => ({
          ...enquiry,
          id: enquiry._id || enquiry.id,
        })),
        total: response.data.data.total,
        pagination: response.data.data.pagination,
      };
    }

    return {
      enquiries: [],
      total: 0,
    };
  },

  /**
   * Reply to an enquiry (Admin only)
   * Sends reply email to the user's email address
   * @param data - Reply data (inquiryId and replyMessage)
   */
  replyToEnquiry: async (data: EnquiryReplyRequest): Promise<EnquiryReplyResponse> => {
    const response = await apiClient.post<EnquiryReplyResponse>(
      `/api/admin/inquiries/${data.enquiryId}/reply`,
      { replyMessage: data.replyMessage }
    );
    return response.data;
  },
};
