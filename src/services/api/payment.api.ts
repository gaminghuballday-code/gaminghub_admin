import apiClient from './client';

// Payment API Types
export interface CreateOrderRequest {
  amountINR: number; // Minimum 1 INR
}

export interface CreateOrderResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    orderId: string; // Razorpay order ID
    key: string; // Razorpay key
    amount: number; // Amount in paise
    currency: string; // INR
    amountINR: number; // Amount in INR
    amountGC: number; // Amount in GC (1 INR = 1 GC)
    prefill?: {
      email?: string;
      name?: string;
    };
  };
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    balanceGC: number; // Updated wallet balance
    amountGC: number; // Amount added
    transaction?: {
      _id: string;
      amountGC: number;
      type: string;
      status: string;
      createdAt: string;
    };
  };
}

export interface PaymentStatusResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    status: string;
    amountGC: number;
    amountINR: number;
    orderId: string;
    paymentId?: string;
    createdAt: string;
  };
}

// QR Code Payment Types
export interface CreateQRCodeRequest {
  amountINR: number; // Minimum 1 INR
}

export interface CreateQRCodeResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    qrCodeId: string;
    qrCodeImage: string; // Base64 or URL of QR code image
    amountINR: number;
    amountGC: number;
    expiresAt?: string;
  };
}

export interface QRCodeStatusResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    qrCodeId: string;
    status: string; // 'active', 'paid', 'closed', 'expired'
    amountINR: number;
    amountGC: number;
    paymentId?: string;
    paidAt?: string;
    expiresAt?: string;
  };
}

export interface QRCodePaymentsResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    payments: Array<{
      paymentId: string;
      amountINR: number;
      amountGC: number;
      status: string;
      paidAt: string;
    }>;
  };
}

export interface CloseQRCodeResponse {
  status: number;
  success: boolean;
  message: string;
}

// UTR Confirmation Types
export interface ConfirmPaymentRequest {
  qrCodeId: string;
  utr: string; // UTR (8-20 characters)
}

export interface ConfirmPaymentResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    qrCodeId: string;
    status: string; // 'pending', 'success', 'failed'
    amountINR: number;
    amountGC: number;
    utr: string;
  };
}

// Admin Payment Verification Types
export interface PendingPayment {
  _id: string;
  userId: string | {
    _id: string;
    email: string;
    name?: string;
  };
  type: string;
  amountGC: number;
  description?: string;
  tournamentId?: string | null;
  status: string; // 'pending', 'fail', etc.
  addedBy: string;
  paymentId?: string | null;
  qrCodeId?: string | null;
  receiptCode?: string | null;
  paymentMethod?: string | null;
  amountINR?: number | null;
  qrCodeExpiresAt?: string | null;
  paymentVerified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  utr?: string | null;
  bankReference?: string | null;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
}

export interface PendingPaymentsResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    pendingPayments: PendingPayment[];
    total?: number;
    limit?: number;
    skip?: number;
    message?: string;
  };
}

export interface UpdatePaymentStatusRequest {
  status: 'success' | 'fail';
}

export interface UpdatePaymentStatusResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    status: string;
    amountGC?: number;
    userId?: string;
  };
}

export const paymentApi = {
  /**
   * Create payment order
   * @param data - Payment order data (amountINR)
   */
  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await apiClient.post<CreateOrderResponse>('/api/payment/create-order', data);
    return response.data;
  },

  /**
   * Verify payment after successful Razorpay payment
   * @param data - Payment verification data
   */
  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post<VerifyPaymentResponse>('/api/payment/verify', data);
    return response.data;
  },

  /**
   * Get payment status by order ID
   * @param orderId - Razorpay order ID
   */
  getPaymentStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get<PaymentStatusResponse>(`/api/payment/status/${orderId}`);
    return response.data;
  },

  /**
   * Create Razorpay QR code for receiving payment
   * @param data - QR code creation data (amountINR)
   */
  createQRCode: async (data: CreateQRCodeRequest): Promise<CreateQRCodeResponse> => {
    const response = await apiClient.post<CreateQRCodeResponse>('/api/payment/create-qr', data);
    return response.data;
  },

  /**
   * Get QR code status and payments
   * @param qrCodeId - QR code ID
   */
  getQRCodeStatus: async (qrCodeId: string): Promise<QRCodeStatusResponse> => {
    const response = await apiClient.get<QRCodeStatusResponse>(`/api/payment/qr-status/${qrCodeId}`);
    return response.data;
  },

  /**
   * Fetch payments for a QR code
   * @param qrCodeId - QR code ID
   */
  getQRCodePayments: async (qrCodeId: string): Promise<QRCodePaymentsResponse> => {
    const response = await apiClient.get<QRCodePaymentsResponse>(`/api/payment/qr-payments/${qrCodeId}`);
    return response.data;
  },

  /**
   * Close a QR code
   * @param qrCodeId - QR code ID
   */
  closeQRCode: async (qrCodeId: string): Promise<CloseQRCodeResponse> => {
    const response = await apiClient.post<CloseQRCodeResponse>(`/api/payment/close-qr/${qrCodeId}`);
    return response.data;
  },

  /**
   * Confirm payment with UTR (Unique Transaction Reference)
   * @param data - Payment confirmation data (qrCodeId, utr)
   */
  confirmPayment: async (data: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> => {
    const response = await apiClient.post<ConfirmPaymentResponse>('/api/payment/confirm', data);
    return response.data;
  },

  /**
   * Get pending payments (Admin only) - payments with UTR that need admin verification
   */
  getPendingPayments: async (): Promise<PendingPaymentsResponse> => {
    const response = await apiClient.get<PendingPaymentsResponse>('/api/admin/payments/pending');
    return response.data;
  },

  /**
   * Update payment status (Admin only) - Approve or Reject payment
   * @param transactionId - Transaction ID
   * @param data - Status update data (status: 'success' for approve, 'fail' for reject)
   */
  updatePaymentStatus: async (transactionId: string, data: UpdatePaymentStatusRequest): Promise<UpdatePaymentStatusResponse> => {
    const response = await apiClient.post<UpdatePaymentStatusResponse>(
      `/api/admin/topup-transactions/${transactionId}/update-status`,
      data
    );
    return response.data;
  },
};
