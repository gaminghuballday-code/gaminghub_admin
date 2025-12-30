import type { TopUpHistoryItem } from '@services/api/wallet.api';
import type { QRCodeStatusResponse } from '@services/api/payment.api';
import type {
  useCreateQRCode,
  useCloseQRCode,
  useConfirmPayment,
} from '@services/api/hooks/usePaymentQueries';
import type { useWithdrawWallet } from '@services/api/hooks/useWalletQueries';

export interface QRPaymentState {
  qrCodeId: string | null;
  qrCodeImage: string | null;
  qrAmount: number;
  paymentStep: 'qr' | 'payment' | 'submitted';
  utr: string;
  utrError: string;
  qrExpiresAt: Date | null;
  timeRemaining: number;
  currentPaymentId: string | null;
  qrStatusFromSocket: QRCodeStatusResponse['data'] | null;
}

export interface UseWalletLogicReturn {
  // Balance
  balance: number | undefined;
  balanceLoading: boolean;
  refetchBalance: () => void;
  
  // History
  history: TopUpHistoryItem[];
  historyLoading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | undefined;
  historyPage: number;
  setHistoryPage: (page: number) => void;
  
  // Top-up form
  topUpAmount: string;
  showTopUpForm: boolean;
  setShowTopUpForm: (show: boolean) => void;
  isProcessing: boolean;
  amountError: string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleQRCodePayment: (e: React.FormEvent) => void;
  createQRCodeMutation: ReturnType<typeof useCreateQRCode>;
  
  // QR Payment
  qrPaymentState: QRPaymentState;
  showQRPaymentModal: boolean;
  setShowQRPaymentModal: (show: boolean) => void;
  qrStatus: QRCodeStatusResponse['data'] | undefined;
  resetQRCodePayment: () => void;
  handleUTRChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUTRSubmit: (e: React.FormEvent) => void;
  confirmPaymentMutation: ReturnType<typeof useConfirmPayment>;
  closeQRCodeMutation: ReturnType<typeof useCloseQRCode>;
  formatTimeRemaining: (seconds: number) => string;
  
  // Withdraw
  showWithdrawModal: boolean;
  setShowWithdrawModal: (show: boolean) => void;
  withdrawAmount: string;
  withdrawError: string;
  handleWithdrawClick: () => void;
  handleWithdrawAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxWithdrawClick: () => void;
  handleWithdrawSubmit: (e: React.FormEvent) => void;
  withdrawWalletMutation: ReturnType<typeof useWithdrawWallet>;
  
  // Utils
  formatDate: (dateString: string) => string;
  maskPaymentId: (paymentId: string) => string;
  handleCopyPaymentId: (paymentId: string, e: React.MouseEvent) => void;
  user: {
    _id?: string;
    userId?: string;
    paymentUPI?: string;
  } | null;
}
