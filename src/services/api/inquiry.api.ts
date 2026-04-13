import apiClient from './client';
import type {
  InquiryRequest,
  InquiryResponse,
  Enquiry,
  EnquiryReplyRequest,
  EnquiryReplyResponse,
  EnquiriesListResponse,
  InquiryReplyTemplate,
  CreateInquiryTemplateRequest,
  UpdateInquiryTemplateRequest,
  InquiryReplyFromTemplateBody,
} from '../types/api.types';

interface RawInquiryTemplate {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  isActive?: boolean;
}

const mapInquiryTemplate = (raw: RawInquiryTemplate): InquiryReplyTemplate | null => {
  const id = raw._id ?? raw.id;
  if (!id || typeof raw.title !== 'string' || typeof raw.message !== 'string') {
    return null;
  }
  return {
    id: String(id),
    title: raw.title,
    message: raw.message,
    isActive: raw.isActive !== false,
  };
};

const extractTemplatesPayload = (payload: unknown): RawInquiryTemplate[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RawInquiryTemplate => item !== null && typeof item === 'object');
  }
  if (payload !== null && typeof payload === 'object' && 'templates' in payload) {
    const templates = (payload as { templates: unknown }).templates;
    if (Array.isArray(templates)) {
      return templates.filter(
        (item): item is RawInquiryTemplate => item !== null && typeof item === 'object'
      );
    }
  }
  if (payload !== null && typeof payload === 'object' && 'data' in payload) {
    return extractTemplatesPayload((payload as { data: unknown }).data);
  }
  return [];
};

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
  }): Promise<{
    enquiries: Enquiry[];
    total?: number;
    pagination?: EnquiriesListResponse['data']['pagination'];
  }> => {
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

    // API returns 'inquiries' (not 'enquiries') and pagination.totalItems
    const inquiries = response.data?.data?.inquiries || response.data?.data?.enquiries;
    
    if (inquiries && Array.isArray(inquiries)) {
      const pagination = response.data?.data?.pagination;
      return {
        enquiries: inquiries.map((enquiry) => ({
          ...enquiry,
          id: enquiry._id || enquiry.id,
          // Determine replied status from repliedAt field
          replied: enquiry.replied !== undefined ? enquiry.replied : !!enquiry.repliedAt,
        })),
        total: pagination?.totalItems || response.data?.data?.total || inquiries.length,
        pagination: pagination,
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

  /**
   * List inquiry reply templates (active only unless includeInactive)
   */
  getInquiryTemplates: async (includeInactive = false): Promise<InquiryReplyTemplate[]> => {
    const response = await apiClient.get<{ data?: unknown }>('/api/admin/inquiries/templates', {
      params: includeInactive ? { includeInactive: 'true' } : undefined,
    });
    const rawList = extractTemplatesPayload(response.data?.data ?? response.data);
    return rawList
      .map((raw) => mapInquiryTemplate(raw))
      .filter((t): t is InquiryReplyTemplate => t !== null);
  },

  /**
   * Create a reply template
   */
  createInquiryTemplate: async (data: CreateInquiryTemplateRequest): Promise<InquiryReplyTemplate> => {
    const response = await apiClient.post<{ data?: unknown }>('/api/admin/inquiries/templates', data);
    const payload = response.data?.data ?? response.data;
    if (payload !== null && typeof payload === 'object') {
      const mapped = mapInquiryTemplate(payload as RawInquiryTemplate);
      if (mapped) {
        return mapped;
      }
    }
    throw new Error('Template was not returned in the expected shape from the server.');
  },

  /**
   * Update a reply template
   */
  updateInquiryTemplate: async (
    templateId: string,
    data: UpdateInquiryTemplateRequest
  ): Promise<InquiryReplyTemplate> => {
    const response = await apiClient.patch<{ data?: unknown }>(
      `/api/admin/inquiries/templates/${encodeURIComponent(templateId)}`,
      data
    );
    const payload = response.data?.data ?? response.data;
    if (payload !== null && typeof payload === 'object') {
      const mapped = mapInquiryTemplate(payload as RawInquiryTemplate);
      if (mapped) {
        return mapped;
      }
    }
    throw new Error('Updated template was not returned in the expected shape from the server.');
  },

  /**
   * Delete a reply template
   */
  deleteInquiryTemplate: async (templateId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/inquiries/templates/${encodeURIComponent(templateId)}`);
  },

  /**
   * Send the same email reply as /reply using a saved template body
   */
  replyToEnquiryFromTemplate: async (
    inquiryId: string,
    body: InquiryReplyFromTemplateBody
  ): Promise<EnquiryReplyResponse> => {
    const response = await apiClient.post<EnquiryReplyResponse>(
      `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/reply-from-template`,
      body
    );
    return response.data;
  },
};
