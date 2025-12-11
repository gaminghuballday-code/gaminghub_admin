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
};
