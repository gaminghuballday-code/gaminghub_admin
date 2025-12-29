import { useState, useEffect } from "react";
import UserSidebar from "@components/user/common/UserSidebar";
import AppHeaderActions from "@components/common/AppHeaderActions";
import Loading from "@components/common/Loading";
import Modal from "@components/common/Modal/Modal";
import {
  useWalletBalance,
  useTopUpHistory,
  useWithdrawWallet,
} from "@services/api/hooks/useWalletQueries";
import {
  useCreateQRCode,
  useQRCodeStatus,
  useCloseQRCode,
  useConfirmPayment,
} from "@services/api/hooks/usePaymentQueries";
import { useAppSelector, useAppDispatch } from "@store/hooks";
import { selectUser } from "@store/slices/authSlice";
import { addToast } from "@store/slices/toastSlice";
import type { TopUpHistoryItem } from "@services/api/wallet.api";
import { useSidebarSync } from "@hooks/useSidebarSync";
import { useWalletWebSocket } from "@hooks/useWalletWebSocket";
import { getSocket } from "@services/websocket/socket";
import { useQueryClient } from "@tanstack/react-query";
import { paymentKeys } from "@services/api/hooks/usePaymentQueries";
import type { QRCodeStatusResponse } from "@services/api/payment.api";
import "./Wallet.scss";

const UserWallet: React.FC = () => {
  const {
    data: balance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance();
  const [historyPage, setHistoryPage] = useState(1);
  const { data: historyData, isLoading: historyLoading } = useTopUpHistory(historyPage);
  const history = historyData?.history ?? [];
  const pagination = historyData?.pagination;
  const withdrawWalletMutation = useWithdrawWallet();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");

  useSidebarSync(sidebarOpen);

  // WebSocket subscription for real-time wallet updates
  useWalletWebSocket({
    enabled: !!(user?._id || user?.userId),
    onBalanceUpdate: () => {
      // Balance will be automatically refetched via query invalidation
    },
    onTransactionUpdate: (data) => {
      // Handle QR payment status updates from admin approval/rejection
      if (
        qrCodeId &&
        paymentStep === "submitted"
      ) {
        // Match transaction by:
        // 1. qrCodeId in description (e.g., "Top-up via QR code (QR: qr_xxx)")
        // 2. transactionId matching currentPaymentId
        // 3. paymentId matching currentPaymentId
        // 4. amount and type matching (topup)
        const description = data.description || "";
        const matchesByQRCode = description.includes(qrCodeId);
        const matchesByPaymentId =
          currentPaymentId &&
          (data.transactionId === currentPaymentId ||
            (data as any).paymentId === currentPaymentId);
        const matchesByAmount =
          data.type === "topup" &&
          Math.abs((data.amountINR || 0) - qrAmount) < 0.01;

        if (matchesByQRCode || matchesByPaymentId || matchesByAmount) {
          // Update currentPaymentId if we got it from the event
          if (data.transactionId && !currentPaymentId) {
            setCurrentPaymentId(data.transactionId);
          }

          // Directly update QR status from WebSocket data (no API call needed)
          // WebSocket event already contains all required information
          const newStatus: QRCodeStatusResponse = {
            status: 200,
            success: true,
            message:
              data.status === "success"
                ? "Payment verified successfully"
                : data.status === "fail"
                ? "Payment verification failed"
                : "Payment verification pending",
            data: {
              qrCodeId: qrCodeId,
              status:
                data.status === "success"
                  ? "paid"
                  : data.status === "fail"
                  ? "failed"
                  : "pending",
              amountINR: data.amountINR || qrAmount,
              amountGC: data.amountGC,
              paymentId:
                currentPaymentId ||
                (data as any).paymentId ||
                data.transactionId ||
                undefined,
              paidAt:
                data.status === "success"
                  ? new Date().toISOString()
                  : undefined,
            },
          };

          // Update React Query cache and local state for immediate UI update
          queryClient.setQueryData<QRCodeStatusResponse>(
            paymentKeys.qrStatus(qrCodeId),
            newStatus
          );
          setQrStatusFromSocket(newStatus.data || null);
        }
      }
    },
    onHistoryUpdate: () => {
      // History will be automatically refetched via query invalidation
    },
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountError, setAmountError] = useState("");
  // Only QR code payment method now

  // QR Payment States - Separate from wallet balance
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [paymentStep, setPaymentStep] = useState<
    "qr" | "payment" | "submitted"
  >("qr");
  const [utr, setUtr] = useState("");
  const [utrError, setUtrError] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [qrStatusFromSocket, setQrStatusFromSocket] = useState<QRCodeStatusResponse['data'] | null>(null); // Store QR status from WebSocket

  // New states for Withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");

  // State for QR Payment Modal
  const [showQRPaymentModal, setShowQRPaymentModal] = useState(false);

  const createQRCodeMutation = useCreateQRCode();
  const confirmPaymentMutation = useConfirmPayment();
  // Only fetch QR status initially (before UTR submission)
  // After UTR submission, we use WebSocket updates directly from cache
  const qrStatusQuery = useQRCodeStatus(
    qrCodeId,
    !!qrCodeId &&
      paymentStep !== "qr" &&
      paymentStep !== "submitted" &&
      !currentPaymentId
  );
  const closeQRCodeMutation = useCloseQRCode();
  const queryClient = useQueryClient();

  // Get QR status: WebSocket update > Query data
  const qrStatus = qrStatusFromSocket || qrStatusQuery.data?.data;

  // Calculate expiration countdown
  useEffect(() => {
    if (!qrExpiresAt || paymentStep === "submitted") {
      setTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = qrExpiresAt.getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        // QR expired
        if (qrCodeId) {
          closeQRCodeMutation.mutate(qrCodeId);
        }
        resetQRCodePayment();
        dispatch(
          addToast({
            message: "QR code expired. Please create a new one.",
            type: "warning",
            duration: 5000,
          })
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrExpiresAt, paymentStep, qrCodeId, closeQRCodeMutation, dispatch]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only numbers (positive integers)
    const numericValue = value.replace(/[^0-9]/g, "");

    if (value !== numericValue) {
      setAmountError("Only numbers are allowed");
    } else {
      setAmountError("");
    }

    setTopUpAmount(numericValue);
  };

  // WebSocket listener for QR code status updates (replaces polling)
  useEffect(() => {
    if (!qrCodeId) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    // Subscribe to QR code updates
    const subscribe = () => {
      socket.emit("subscribe:qr", qrCodeId);
    };

    if (socket.connected) {
      subscribe();
    } else {
      socket.once("connect", subscribe);
    }

    // Handle QR status updates from WebSocket
    const handleQRStatusUpdate = (payload: {
      qrCodeId: string;
      status: QRCodeStatusResponse;
    }) => {
      // Only process if it's for the current QR code
      if (payload.qrCodeId !== qrCodeId) {
        return;
      }

      // Update React Query cache and local state
      queryClient.setQueryData<QRCodeStatusResponse>(
        paymentKeys.qrStatus(qrCodeId),
        payload.status
      );
      setQrStatusFromSocket(payload.status.data || null);
    };

    socket.on("payment:qr-status-updated", handleQRStatusUpdate);

    return () => {
      if (socket) {
        socket.off("payment:qr-status-updated", handleQRStatusUpdate);
        // Unsubscribe from QR code updates
        socket.emit("unsubscribe:qr", qrCodeId);
      }
    };
  }, [qrCodeId, queryClient]);

  // Store paymentId from QR status for WebSocket matching
  useEffect(() => {
    if (qrStatus?.paymentId && !currentPaymentId) {
      setCurrentPaymentId(qrStatus.paymentId);
    }
  }, [qrStatus?.paymentId, currentPaymentId]);

  // Handle QR status changes - refresh balance when payment is verified
  useEffect(() => {
    if (
      !qrCodeId ||
      !qrStatus ||
      paymentStep === "qr" ||
      paymentStep === "payment"
    ) {
      return;
    }

    const status = qrStatus.status;

    // Handle successful payment - refresh balance
    if (status === "paid" || status === "success") {
      refetchBalance();
    } else if (status === "failed") {
      dispatch(
        addToast({
          message: "Payment verification failed. Please try again.",
          type: "error",
          duration: 6000,
        })
      );
    } else if (status === "expired" || status === "closed") {
      dispatch(
        addToast({
          message: "QR code expired or closed. Please create a new one.",
          type: "warning",
          duration: 5000,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    qrStatus?.status,
    qrCodeId,
    paymentStep,
    dispatch,
    refetchBalance,
  ]);

  // Cleanup on unmount - stop polling and close QR if active
  useEffect(() => {
    return () => {
      if (qrCodeId) {
        // Close QR code on unmount to prevent orphaned QR codes
        closeQRCodeMutation.mutate(qrCodeId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetQRCodePayment = () => {
    setQrCodeId(null);
    setQrCodeImage(null);
    setQrAmount(0);
    setPaymentStep("qr");
    setUtr("");
    setUtrError("");
    setQrExpiresAt(null);
    setTimeRemaining(0);
    setTopUpAmount("");
    setAmountError("");
    setCurrentPaymentId(null);
    setQrStatusFromSocket(null);
    setShowQRPaymentModal(false);
  };

  // Validate UTR format (8-20 characters, alphanumeric)
  const validateUTR = (value: string): boolean => {
    const trimmed = value.trim();
    return (
      trimmed.length >= 8 &&
      trimmed.length <= 20 &&
      /^[A-Za-z0-9]+$/.test(trimmed)
    );
  };

  const handleUTRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toUpperCase();
    setUtr(value);

    if (value.length > 0 && !validateUTR(value)) {
      setUtrError("UTR must be 8-20 alphanumeric characters");
    } else {
      setUtrError("");
    }
  };

  const handleQRCodePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent creating new QR if one is already active
    if (qrCodeId && paymentStep !== "qr") {
      dispatch(
        addToast({
          message:
            "Please complete or cancel the current payment before starting a new one.",
          type: "warning",
          duration: 5000,
        })
      );
      return;
    }

    const amountINR = parseFloat(topUpAmount);

    if (isNaN(amountINR) || amountINR < 1) {
      setAmountError("Minimum top-up amount is ₹1");
      return;
    }

    setAmountError("");
    setIsProcessing(true);

    try {
      const result = await createQRCodeMutation.mutateAsync({
        amountINR: amountINR,
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to create QR code");
      }

      // Set QR code data and move to payment step
      setQrCodeImage(result.data.qrCodeImage);
      setQrCodeId(result.data.qrCodeId);
      setQrAmount(amountINR);
      setPaymentStep("payment");
      setShowQRPaymentModal(true); // Open modal when QR code is generated

      // Set expiration time (default 10 minutes if not provided)
      if (result.data.expiresAt) {
        setQrExpiresAt(new Date(result.data.expiresAt));
      } else {
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 10);
        setQrExpiresAt(expires);
      }

      dispatch(
        addToast({
          message: "QR code generated! Scan with your UPI app to pay.",
          type: "success",
          duration: 4000,
        })
      );
    } catch (error: any) {
      dispatch(
        addToast({
          message:
            error?.message || "Failed to create QR code. Please try again.",
          type: "error",
          duration: 6000,
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUTRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qrCodeId) {
      dispatch(
        addToast({
          message: "QR code not found. Please generate a new QR code.",
          type: "error",
          duration: 5000,
        })
      );
      return;
    }

    const trimmedUtr = utr.trim();

    if (!trimmedUtr) {
      setUtrError("Please enter UTR");
      return;
    }

    if (!validateUTR(trimmedUtr)) {
      setUtrError("UTR must be 8-20 alphanumeric characters");
      return;
    }

    setUtrError("");

    try {
      await confirmPaymentMutation.mutateAsync({
        qrCodeId,
        utr: trimmedUtr,
      });

      // Move to submitted step - show verification message
      setPaymentStep("submitted");
    } catch (error: any) {
      // Error handling is done in the hook
      // Don't move to submitted step if submission failed
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Mask payment ID (show first 4 and last 4 characters, mask middle with ****)
  const maskPaymentId = (paymentId: string): string => {
    if (paymentId.length <= 8) {
      return paymentId; // Don't mask if too short
    }
    const firstPart = paymentId.slice(0, 4);
    const lastPart = paymentId.slice(-4);
    return `${firstPart}****${lastPart}`;
  };

  // Copy payment ID to clipboard
  const handleCopyPaymentId = async (paymentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(paymentId);
      dispatch(
        addToast({
          message: "Payment ID copied to clipboard",
          type: "success",
          duration: 3000,
        })
      );
    } catch (error) {
      dispatch(
        addToast({
          message: "Failed to copy Payment ID",
          type: "error",
          duration: 3000,
        })
      );
    }
  };

  const getStatusBadge = (status: string) => {
    // Normalize status: "fail" -> "failed", keep others as is
    const normalizedStatus =
      status === "fail" ? "failed" : status.toLowerCase();
    const statusClass = `status-badge status-${normalizedStatus}`;
    const statusLabel =
      normalizedStatus === "failed"
        ? "Failed"
        : normalizedStatus === "pending"
        ? "Pending"
        : normalizedStatus === "completed"
        ? "Completed"
        : status.charAt(0).toUpperCase() + status.slice(1);
    return <span className={statusClass}>{statusLabel}</span>;
  };

  const getTypeBadge = (type: string) => {
    const typeClass = `type-badge type-${type.toLowerCase()}`;
    const typeLabel =
      type === "topup"
        ? "Top Up"
        : type === "deduction"
        ? "Deduction"
        : "Refund";
    return <span className={typeClass}>{typeLabel}</span>;
  };


  // Handle Withdraw
  const handleWithdrawClick = () => {
    // Check if payment UPI is set
    if (!user?.paymentUPI) {
      dispatch(
        addToast({
          message:
            "Please update your Payment UPI in your profile before withdrawing.",
          type: "warning",
          duration: 6000,
        })
      );
      return;
    }

    setWithdrawAmount("");
    setWithdrawError("");
    setShowWithdrawModal(true);
  };

  const handleWithdrawAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");

    if (value !== numericValue) {
      setWithdrawError("Only numbers are allowed");
    } else {
      setWithdrawError("");
    }

    setWithdrawAmount(numericValue);
  };

  const handleMaxWithdrawClick = () => {
    if (balance && balance > 0) {
      setWithdrawAmount(balance.toString());
      setWithdrawError("");
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountGC = parseFloat(withdrawAmount);

    if (isNaN(amountGC) || amountGC <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }

    if (!balance || amountGC > balance) {
      setWithdrawError("Insufficient balance");
      return;
    }

    setWithdrawError("");

    try {
      await withdrawWalletMutation.mutateAsync({
        amountGC: amountGC,
        description: "Withdraw request",
      });

      setShowWithdrawModal(false);
      setWithdrawAmount("");
      refetchBalance();
    } catch (error: any) {
      setWithdrawError(error?.message || "Failed to process withdraw request");
    }
  };

  return (
    <div className="user-wallet-container">
      <UserSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

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
                  className={balanceLoading ? "spinning" : ""}
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
                    <span className="balance-amount">
                      {balance?.toLocaleString("en-IN") ?? 0} GC
                    </span>
                  </div>
                  <div className="wallet-action-buttons">
                    <button
                      className="topup-button"
                      onClick={() => setShowTopUpForm(!showTopUpForm)}
                    >
                      {showTopUpForm ? "Cancel" : "Top Up"}
                    </button>
                    <button
                      className="withdraw-button"
                      onClick={handleWithdrawClick}
                    >
                      Withdraw
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Top Up Form */}
            {showTopUpForm && (!qrCodeId || paymentStep === "qr") && (
              <form
                className="topup-form"
                onSubmit={handleQRCodePayment}
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
                    placeholder="Enter amount in INR (Minimum ₹1)"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    disabled={
                      isProcessing ||
                      createQRCodeMutation.isPending
                    }
                  />
                  {amountError && (
                    <small
                      className="form-error"
                      style={{
                        color: "#ef4444",
                        fontSize: "0.85rem",
                        marginTop: "4px",
                      }}
                    >
                      {amountError}
                    </small>
                  )}
                  <small className="form-hint">
                    1 INR = 1 GC. You will receive{" "}
                    {topUpAmount ? parseFloat(topUpAmount) || 0 : 0} GC after
                    payment. Minimum top-up: ₹1
                  </small>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowTopUpForm(false);
                      setTopUpAmount("");
                      setAmountError("");
                      resetQRCodePayment();
                    }}
                    disabled={
                      isProcessing ||
                      createQRCodeMutation.isPending
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={
                      isProcessing ||
                      createQRCodeMutation.isPending ||
                      !topUpAmount ||
                      parseFloat(topUpAmount) < 1 ||
                      !!amountError
                    }
                  >
                    {isProcessing || createQRCodeMutation.isPending
                      ? "Processing..."
                      : "Generate QR Code"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* QR Payment Modal */}
          <Modal
            isOpen={showQRPaymentModal && !!qrCodeId && !!qrCodeImage && paymentStep !== "qr"}
            onClose={() => {
              // If user closes without submitting UTR, close QR code on backend
              if (qrCodeId && paymentStep === "payment") {
                closeQRCodeMutation.mutate(qrCodeId);
              }
              resetQRCodePayment();
            }}
            title="Complete Payment"
            showCloseButton={true}
            closeOnOverlayClick={true}
          >
            <div className="qr-code-payment-container">
              {/* Step Indicators */}
              <div className="payment-steps">
                <div
                  className={`step ${
                    paymentStep === "payment" || paymentStep === "submitted"
                      ? "active"
                      : ""
                  } ${paymentStep === "submitted" ? "completed" : ""}`}
                >
                  <div className="step-number">1</div>
                  <div className="step-label">QR Code</div>
                </div>
                <div
                  className={`step ${
                    paymentStep === "payment" ? "active" : ""
                  } ${paymentStep === "submitted" ? "completed" : ""}`}
                >
                  <div className="step-number">2</div>
                  <div className="step-label">Payment</div>
                </div>
              </div>

              {/* Step 1: QR Code Display */}
              {paymentStep === "payment" && (
                <div className="qr-code-content">
                  <div className="qr-code-image-wrapper">
                    <img
                      src={qrCodeImage || ""}
                      alt="Payment QR Code"
                      className="qr-code-image"
                    />
                    <div className="qr-code-pulse"></div>
                  </div>

                  <div className="qr-code-info">
                    <div className="qr-amount-info">
                      <span className="qr-amount-label">Amount to Pay:</span>
                      <span className="qr-amount-value">₹{qrAmount}</span>
                    </div>

                    {timeRemaining > 0 && (
                      <div className="qr-expiration">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>
                          Expires in: {formatTimeRemaining(timeRemaining)}
                        </span>
                      </div>
                    )}

                    <p className="qr-instructions">
                      Scan this QR code with any UPI app (PhonePe, Google Pay,
                      Paytm, etc.) to complete payment
                    </p>

                    {/* Additional Instructions */}
                    <div className="qr-additional-instructions">
                      <p>
                        After scanning and paying, come back here to enter
                        your UTR number.
                      </p>
                    </div>

                    {/* UTR Submission Form */}
                    <div className="utr-form-section">
                      <p className="utr-instructions">
                        After making the payment, enter your UTR (Unique
                        Transaction Reference) below:
                      </p>
                      <form onSubmit={handleUTRSubmit} className="utr-form">
                        <div className="form-group">
                          <label htmlFor="utr" className="form-label">
                            UTR Number
                          </label>
                          <input
                            type="text"
                            id="utr"
                            className="form-input"
                            value={utr}
                            onChange={handleUTRChange}
                            placeholder="Enter UTR (8-20 characters)"
                            maxLength={20}
                            required
                            disabled={confirmPaymentMutation.isPending}
                          />
                          {utrError && (
                            <small className="form-error">{utrError}</small>
                          )}
                          <small className="form-hint">
                            Find UTR in your payment app or bank SMS (8-20
                            alphanumeric characters)
                          </small>
                        </div>
                        <button
                          type="submit"
                          className="submit-button"
                          disabled={
                            confirmPaymentMutation.isPending ||
                            !utr.trim() ||
                            !validateUTR(utr.trim()) ||
                            !!utrError
                          }
                        >
                          {confirmPaymentMutation.isPending
                            ? "Submitting..."
                            : "Submit UTR"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Submitted - Verification Message */}
              {paymentStep === "submitted" && (
                <div className="qr-code-content">
                  <div className="verification-message">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="info-icon"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <h4>Payment Submitted</h4>
                    <p className="verification-info">
                      Your payment has been submitted successfully. Our team will verify your payment within 5-10 minutes.
                    </p>
                    <p className="verification-note">
                      You can close this modal. You will be notified once the payment is verified.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Modal>

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
                {history.some(
                  (t: TopUpHistoryItem) => t.status === "pending"
                ) && (
                  <div className="pending-info">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>
                      Pending transactions are waiting for admin approval
                    </span>
                  </div>
                )}
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Amount (GC)</th>
                        <th>Status</th>
                        <th>Payment ID</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((transaction: TopUpHistoryItem, index: number) => {
                        const serialNumber = (historyPage - 1) * (pagination?.itemsPerPage || 20) + index + 1;
                        return (
                          <tr key={transaction._id}>
                            <td className="serial-cell">
                              {serialNumber}
                            </td>
                            <td className="date-cell">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="type-cell">
                              {getTypeBadge(transaction.type)}
                            </td>
                            <td
                              className={`amount-cell ${
                                transaction.type === "deduction"
                                  ? "negative"
                                  : "positive"
                              }`}
                            >
                              {transaction.type === "deduction" ? "-" : "+"}
                              {transaction.amountGC.toLocaleString("en-IN")}
                            </td>
                            <td className="status-cell">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="payment-id-cell">
                              {transaction.paymentId ? (
                                <div className="payment-id-wrapper">
                                  <code 
                                    className="payment-id-code"
                                    title={transaction.paymentId}
                                  >
                                    {maskPaymentId(transaction.paymentId)}
                                  </code>
                                  <button
                                    type="button"
                                    className="copy-payment-id-btn"
                                    onClick={(e) => handleCopyPaymentId(transaction.paymentId!, e)}
                                    title="Copy Payment ID"
                                    aria-label="Copy Payment ID"
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <span className="no-payment-id">-</span>
                              )}
                            </td>
                            <td className="description-cell">
                              {transaction.description || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      className="pagination-button"
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={!pagination.hasPrevPage || historyLoading}
                      title="Previous Page"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      Previous
                    </button>

                    <div className="pagination-info">
                      <span>
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <span className="pagination-count">
                        ({pagination.totalItems} total items)
                      </span>
                    </div>

                    <button
                      className="pagination-button"
                      onClick={() => setHistoryPage((prev) => prev + 1)}
                      disabled={!pagination.hasNextPage || historyLoading}
                      title="Next Page"
                    >
                      Next
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-history">
                <p>No transaction history available</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          setWithdrawAmount("");
          setWithdrawError("");
        }}
        title="Withdraw Funds"
        showCloseButton={true}
      >
        <form className="withdraw-form" onSubmit={handleWithdrawSubmit}>
          <div className="form-group">
            <label htmlFor="withdraw-amount" className="form-label">
              Amount (GC)
            </label>
            <div className="input-with-max-button">
              <input
                type="text"
                id="withdraw-amount"
                className="form-input"
                value={withdrawAmount}
                onChange={handleWithdrawAmountChange}
                placeholder="Enter amount to withdraw"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                disabled={withdrawWalletMutation.isPending}
              />
              <button
                type="button"
                className="max-button"
                onClick={handleMaxWithdrawClick}
                disabled={
                  withdrawWalletMutation.isPending || !balance || balance <= 0
                }
                title={`Max: ${balance?.toLocaleString("en-IN") ?? 0} GC`}
              >
                Max
              </button>
            </div>
            {withdrawError && (
              <small
                className="form-error"
                style={{
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  marginTop: "4px",
                }}
              >
                {withdrawError}
              </small>
            )}
            <small className="form-hint">
              Available balance: {balance?.toLocaleString("en-IN") ?? 0} GC
            </small>
            {user?.paymentUPI && (
              <small
                className="form-hint"
                style={{ marginTop: "8px", display: "block" }}
              >
                Funds will be sent to: {user.paymentUPI}
              </small>
            )}
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowWithdrawModal(false);
                setWithdrawAmount("");
                setWithdrawError("");
              }}
              disabled={withdrawWalletMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={
                withdrawWalletMutation.isPending ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                !balance ||
                parseFloat(withdrawAmount) > balance ||
                !!withdrawError
              }
            >
              {withdrawWalletMutation.isPending ? "Processing..." : "Withdraw"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserWallet;
