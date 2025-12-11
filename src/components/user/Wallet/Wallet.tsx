import { useState, useEffect } from 'react';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import { useWalletBalance, useTopUpHistory } from '@services/api/hooks/useWalletQueries';
import { 
  useCreatePaymentOrder, 
  useVerifyPayment,
  useCreateQRCode,
  useQRCodeStatus,
  useCloseQRCode
} from '@services/api/hooks/usePaymentQueries';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import { addToast } from '@store/slices/toastSlice';
import type { TopUpHistoryItem } from '@services/api/wallet.api';
import './Wallet.scss';

const UserWallet: React.FC = () => {
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useWalletBalance();
  const { data: history, isLoading: historyLoading } = useTopUpHistory();
  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'qr'>('qr'); // Default to QR code
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  
  const createQRCodeMutation = useCreateQRCode();
  const qrStatusQuery = useQRCodeStatus(
    qrCodeId,
    !!qrCodeId && paymentMethod === 'qr'
  );
  const closeQRCodeMutation = useCloseQRCode();
  
  // Extract the actual status data from the API response
  // The query returns QRCodeStatusResponse which has a nested 'data' property
  const qrStatus = qrStatusQuery.data && 'data' in qrStatusQuery.data 
    ? qrStatusQuery.data.data 
    : undefined;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow only numbers (positive integers)
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (value !== numericValue) {
      setAmountError('Only numbers are allowed');
    } else {
      setAmountError('');
    }
    
    setTopUpAmount(numericValue);
  };

  // Poll QR code status and handle payment completion
  useEffect(() => {
    if (qrCodeId && paymentMethod === 'qr' && qrStatus) {
      const status = qrStatus.status;
      
      if (status === 'paid') {
        // Payment successful
        dispatch(addToast({
          message: `Payment successful! ${qrStatus.amountGC} GC added to your wallet.`,
          type: 'success',
          duration: 5000,
        }));
        
        // Refresh wallet balance and history
        refetchBalance();
        
        // Close QR code and reset
        closeQRCodeMutation.mutate(qrCodeId, {
          onSuccess: () => {
            resetQRCodePayment();
          },
        });
      } else if (status === 'expired' || status === 'closed') {
        // QR code expired or closed
        dispatch(addToast({
          message: 'QR code expired or closed. Please create a new one.',
          type: 'warning',
          duration: 5000,
        }));
        resetQRCodePayment();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrStatus?.status, qrCodeId, paymentMethod, dispatch, refetchBalance]);

  const resetQRCodePayment = () => {
    setQrCodeId(null);
    setQrCodeImage(null);
    setTopUpAmount('');
    setAmountError('');
  };

  const handleQRCodePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountINR = parseFloat(topUpAmount);
    
    if (isNaN(amountINR) || amountINR < 50) {
      setAmountError('Minimum top-up amount is ₹50');
      return;
    }
    
    setAmountError('');
    setIsProcessing(true);

    try {
      const result = await createQRCodeMutation.mutateAsync({
        amountINR: amountINR,
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to create QR code');
      }

      setQrCodeImage(result.data.qrCodeImage);
      setQrCodeId(result.data.qrCodeId);
      
      dispatch(addToast({
        message: 'QR code generated! Scan with your UPI app to pay.',
        type: 'success',
        duration: 4000,
      }));
    } catch (error: any) {
      console.error('QR code creation error:', error);
      dispatch(addToast({
        message: error?.message || 'Failed to create QR code. Please try again.',
        type: 'error',
        duration: 6000,
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountINR = parseFloat(topUpAmount);
    
    if (isNaN(amountINR) || amountINR < 50) {
      setAmountError('Minimum top-up amount is ₹50');
      return;
    }
    
    setAmountError('');

    setIsProcessing(true);

    try {
      // Step 1: Create order from backend
      const orderResult = await createOrderMutation.mutateAsync({
        amountINR: amountINR,
      });

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.message || 'Failed to create order');
      }

      const orderData = orderResult.data;

      // Step 2: Initialize Razorpay
      if (!window.Razorpay && !(window as any).Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      const Razorpay = window.Razorpay || (window as any).Razorpay;

      const options = {
        key: orderData.key,
        amount: orderData.amount, // Amount in paise
        currency: orderData.currency, // INR
        name: 'BooyahX Gaming',
        description: `Top-up ${orderData.amountGC} GC`,
        order_id: orderData.orderId,
        
        // Handler function - called when payment is successful
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Step 3: Verify payment on backend
            await verifyPaymentMutation.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Refresh wallet balance and history
            refetchBalance();
            
            // Reset form
            setTopUpAmount('');
            setAmountError('');
            setShowTopUpForm(false);
          } catch (error) {
            console.error('Payment verification error:', error);
            // Error toast is handled by the hook
          } finally {
            setIsProcessing(false);
          }
        },
        
        // Prefill user details
        prefill: {
          email: orderData.prefill?.email || user?.email || '',
          name: orderData.prefill?.name || user?.name || '',
        },
        
        // Theme customization
        theme: {
          color: '#3399cc',
        },
        
        // Modal settings
        modal: {
          ondismiss: () => {
            // User closed the payment modal
            setIsProcessing(false);
          },
        },
      };

      // Create Razorpay instance and open checkout
      const razorpay = new Razorpay(options);
      razorpay.open();

      // Handle payment failure
      razorpay.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        setIsProcessing(false);
        dispatch(addToast({
          message: `Payment failed: ${response.error.description || 'Please try again.'}`,
          type: 'error',
          duration: 6000,
        }));
      });

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      setIsProcessing(false);
      // Error toast is handled by API interceptor
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    // Normalize status: "fail" -> "failed", keep others as is
    const normalizedStatus = status === 'fail' ? 'failed' : status.toLowerCase();
    const statusClass = `status-badge status-${normalizedStatus}`;
    const statusLabel = normalizedStatus === 'failed' ? 'Failed' : 
                       normalizedStatus === 'pending' ? 'Pending' : 
                       normalizedStatus === 'completed' ? 'Completed' : 
                       status.charAt(0).toUpperCase() + status.slice(1);
    return <span className={statusClass}>{statusLabel}</span>;
  };

  const getTypeBadge = (type: string) => {
    const typeClass = `type-badge type-${type.toLowerCase()}`;
    const typeLabel = type === 'topup' ? 'Top Up' : type === 'deduction' ? 'Deduction' : 'Refund';
    return <span className={typeClass}>{typeLabel}</span>;
  };

  return (
    <div className="user-wallet-container">
      <UserSidebar />

      <main className="user-main">
        <header className="user-header">
          <h1>Wallet</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          {/* Balance Card */}
          <div className="wallet-card balance-card">
            <div className="card-header">
              <h2 className="card-title">Wallet Balance</h2>
              <button
                className="refresh-button"
                onClick={() => refetchBalance()}
                disabled={balanceLoading}
                title="Refresh Balance"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={balanceLoading ? 'spinning' : ''}
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              </button>
            </div>
            <div className="balance-display">
              {balanceLoading ? (
                <div className="balance-loading">
                  <Loading />
                </div>
              ) : (
                <>
                  <div className="balance-info">
                    <span className="balance-label">Current Balance</span>
                    <span className="balance-amount">{balance?.toLocaleString('en-IN') ?? 0} GC</span>
                  </div>
                  <button
                    className="topup-button"
                    onClick={() => setShowTopUpForm(!showTopUpForm)}
                  >
                    {showTopUpForm ? 'Cancel' : 'Top Up'}
                  </button>
                </>
              )}
            </div>

            {/* Top Up Form */}
            {showTopUpForm && !qrCodeId && (
              <>
                {/* Payment Method Selection */}
                <div className="payment-method-selector">
                  <label className="form-label">Payment Method</label>
                  <div className="payment-method-options">
                    <button
                      type="button"
                      className={`payment-method-btn ${paymentMethod === 'qr' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('qr')}
                      disabled={isProcessing}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <path d="M3 9h18M9 21V9"></path>
                      </svg>
                      QR Code (Simple)
                    </button>
                    <button
                      type="button"
                      className={`payment-method-btn ${paymentMethod === 'razorpay' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('razorpay')}
                      disabled={isProcessing}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      Card/UPI
                    </button>
                  </div>
                </div>

                <form 
                  className="topup-form" 
                  onSubmit={paymentMethod === 'qr' ? handleQRCodePayment : handlePayment}
                >
                  <div className="form-group">
                    <label htmlFor="amount" className="form-label">
                      Amount (INR)
                    </label>
                    <input
                      type="text"
                      id="amount"
                      className="form-input"
                      value={topUpAmount}
                      onChange={handleAmountChange}
                      placeholder="Enter amount in INR (Minimum ₹50)"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      disabled={isProcessing || createOrderMutation.isPending || createQRCodeMutation.isPending}
                    />
                    {amountError && (
                      <small className="form-error" style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>
                        {amountError}
                      </small>
                    )}
                    <small className="form-hint">
                      1 INR = 1 GC. You will receive {topUpAmount ? parseFloat(topUpAmount) || 0 : 0} GC after payment. Minimum top-up: ₹50
                    </small>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setShowTopUpForm(false);
                        setTopUpAmount('');
                        setAmountError('');
                        resetQRCodePayment();
                      }}
                      disabled={isProcessing || createOrderMutation.isPending || createQRCodeMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={
                        isProcessing || 
                        createOrderMutation.isPending || 
                        createQRCodeMutation.isPending ||
                        !topUpAmount || 
                        parseFloat(topUpAmount) < 50 || 
                        !!amountError
                      }
                    >
                      {isProcessing || createOrderMutation.isPending || createQRCodeMutation.isPending 
                        ? 'Processing...' 
                        : paymentMethod === 'qr' 
                          ? 'Generate QR Code' 
                          : 'Pay Now'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* QR Code Display */}
            {qrCodeId && qrCodeImage && (
              <div className="qr-code-payment-container">
                <div className="qr-code-header">
                  <h3>Scan QR Code to Pay</h3>
                  <button
                    type="button"
                    className="close-qr-button"
                    onClick={() => {
                      if (qrCodeId) {
                        closeQRCodeMutation.mutate(qrCodeId);
                      }
                      resetQRCodePayment();
                      setShowTopUpForm(false);
                    }}
                    title="Close"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="qr-code-content">
                  <div className="qr-code-image-wrapper">
                    <img 
                      src={qrCodeImage} 
                      alt="Payment QR Code" 
                      className="qr-code-image"
                    />
                    {qrStatus?.status === 'active' && (
                      <div className="qr-code-pulse"></div>
                    )}
                  </div>
                  
                  <div className="qr-code-info">
                    <div className="qr-amount-info">
                      <span className="qr-amount-label">Amount to Pay:</span>
                      <span className="qr-amount-value">₹{topUpAmount}</span>
                    </div>
                    <p className="qr-instructions">
                      Scan this QR code with any UPI app (PhonePe, Google Pay, Paytm, etc.) to complete payment
                    </p>
                    
                    {qrStatus?.status === 'active' && (
                      <div className="qr-status-checking">
                        <Loading />
                        <span>Waiting for payment...</span>
                      </div>
                    )}
                    
                    {qrStatus?.status === 'paid' && (
                      <div className="qr-status-success">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Payment received! Updating wallet...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Card */}
          <div className="wallet-card history-card">
            <div className="card-header">
              <h2 className="card-title">Transaction History</h2>
            </div>
            {historyLoading ? (
              <div className="history-loading">
                <Loading />
              </div>
            ) : history && history.length > 0 ? (
              <>
                {history.some((t: TopUpHistoryItem) => t.status === 'pending') && (
                  <div className="pending-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>Pending transactions are waiting for admin approval</span>
                  </div>
                )}
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Amount (GC)</th>
                        <th>Status</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...history]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((transaction: TopUpHistoryItem) => (
                        <tr key={transaction._id}>
                          <td className="date-cell">{formatDate(transaction.createdAt)}</td>
                          <td className="type-cell">{getTypeBadge(transaction.type)}</td>
                          <td className={`amount-cell ${transaction.type === 'deduction' ? 'negative' : 'positive'}`}>
                            {transaction.type === 'deduction' ? '-' : '+'}
                            {transaction.amountGC.toLocaleString('en-IN')}
                          </td>
                          <td className="status-cell">{getStatusBadge(transaction.status)}</td>
                          <td className="description-cell">
                            {transaction.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="no-history">
                <p>No transaction history available</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserWallet;

