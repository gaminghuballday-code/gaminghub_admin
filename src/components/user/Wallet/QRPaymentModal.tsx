import React from 'react';
import Modal from '@components/common/Modal/Modal';
import { Button } from '@components/common/Button';
import type { QRPaymentState } from './Wallet.types';

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrPaymentState: QRPaymentState;
  formatTimeRemaining: (seconds: number) => string;
  handleUTRChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUTRSubmit: (e: React.FormEvent) => void;
  confirmPaymentMutation: {
    isPending: boolean;
  };
  closeQRCodeMutation: {
    mutate: (qrCodeId: string) => void;
  };
  resetQRCodePayment: () => void;
}

const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
  isOpen,
  onClose,
  qrPaymentState,
  formatTimeRemaining,
  handleUTRChange,
  handleUTRSubmit,
  confirmPaymentMutation,
  closeQRCodeMutation,
  resetQRCodePayment,
}) => {
  const handleClose = () => {
    // If user closes without submitting UTR, close QR code on backend
    if (qrPaymentState.qrCodeId && qrPaymentState.paymentStep === 'payment') {
      closeQRCodeMutation.mutate(qrPaymentState.qrCodeId);
    }
    resetQRCodePayment();
    onClose();
  };

  const modalIsOpen = isOpen && !!qrPaymentState.qrCodeId && !!qrPaymentState.qrCodeImage && qrPaymentState.paymentStep !== 'qr';
  
  return (
    <Modal
      isOpen={modalIsOpen}
      onClose={handleClose}
      title="Complete Payment"
      showCloseButton={true}
      closeOnOverlayClick={true}
    >
      <div className="qr-code-payment-container">
        {/* Step Indicators */}
        <div className="payment-steps">
          <div
            className={`step ${
              qrPaymentState.paymentStep === 'payment' || qrPaymentState.paymentStep === 'submitted'
                ? 'active'
                : ''
            } ${qrPaymentState.paymentStep === 'submitted' ? 'completed' : ''}`}
          >
            <div className="step-number">1</div>
            <div className="step-label">QR Code</div>
          </div>
          <div
            className={`step ${
              qrPaymentState.paymentStep === 'payment' ? 'active' : ''
            } ${qrPaymentState.paymentStep === 'submitted' ? 'completed' : ''}`}
          >
            <div className="step-number">2</div>
            <div className="step-label">Payment</div>
          </div>
        </div>

        {/* Step 1: QR Code Display */}
        {qrPaymentState.paymentStep === 'payment' && (
          <div className="qr-code-content">
            <div className="qr-code-image-wrapper">
              <img
                src={qrPaymentState.qrCodeImage || ''}
                alt="Payment QR Code"
                className="qr-code-image"
              />
              <div className="qr-code-pulse"></div>
            </div>

            <div className="qr-code-info">
              <div className="qr-amount-info">
                <span className="qr-amount-label">Amount to Pay:</span>
                <span className="qr-amount-value">₹{qrPaymentState.qrAmount}</span>
              </div>

              {qrPaymentState.timeRemaining > 0 && (
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
                    Expires in: {formatTimeRemaining(qrPaymentState.timeRemaining)}
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
                      value={qrPaymentState.utr}
                      onChange={handleUTRChange}
                      placeholder="Enter UTR (8-20 characters)"
                      maxLength={20}
                      required
                      disabled={confirmPaymentMutation.isPending}
                    />
                    {qrPaymentState.utrError && (
                      <small className="form-error">{qrPaymentState.utrError}</small>
                    )}
                    <small className="form-hint">
                      Find UTR in your payment app or bank SMS (8-20
                      alphanumeric characters)
                    </small>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={confirmPaymentMutation.isPending}
                    disabled={
                      !qrPaymentState.utr.trim() ||
                      qrPaymentState.utrError !== '' ||
                      qrPaymentState.utr.length < 8
                    }
                  >
                    Submit UTR
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Submitted - Verification Message */}
        {qrPaymentState.paymentStep === 'submitted' && (
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
  );
};

export default QRPaymentModal;
