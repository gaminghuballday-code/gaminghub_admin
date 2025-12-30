import React, { useState, useEffect } from 'react';
import AdminLayout from '@components/common/AdminLayout';
import Loading from '@components/common/Loading';
import ConfirmationModal from '@components/common/ConfirmationModal';
import Modal from '@components/common/Modal/Modal';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import { usePendingPayments, useUpdatePaymentStatus } from '@services/api/hooks/usePaymentQueries';
import { getSocket } from '@services/websocket/socket';
import type { PendingPayment } from '@services/api/payment.api';
import './PaymentVerificationPage.scss';

const PaymentVerificationPage: React.FC = () => {
  const { data: pendingPaymentsData, isLoading, error, refetch } = usePendingPayments();
  const updatePaymentStatusMutation = useUpdatePaymentStatus();

  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const pendingPayments = pendingPaymentsData?.data?.pendingPayments || [];

  // WebSocket for real-time payment status updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    // Listen for payment status updates
    const handlePaymentStatusUpdate = () => {
      // Invalidate pending payments to refetch updated list
      refetch();
    };

    socket.on('wallet:transaction-updated', handlePaymentStatusUpdate);

    return () => {
      if (socket) {
        socket.off('wallet:transaction-updated', handlePaymentStatusUpdate);
      }
    };
  }, [refetch]);

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

  const handleApproveClick = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setShowApproveModal(true);
  };

  const handleRejectClick = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedPayment) return;

    try {
      await updatePaymentStatusMutation.mutateAsync({
        transactionId: selectedPayment._id,
        status: 'success',
      });
      setShowApproveModal(false);
      setSelectedPayment(null);
      refetch();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedPayment) return;

    try {
      await updatePaymentStatusMutation.mutateAsync({
        transactionId: selectedPayment._id,
        status: 'fail',
      });
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectReason('');
      refetch();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <AdminLayout title="Payment Verification">
      <div className="payment-verification-content-wrapper">
        <div className="payment-verification-card">
          <div className="card-header">
            <h2 className="card-title">Pending Payment Verifications</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              loading={isLoading}
              title="Refresh"
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              }
            >
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <Loading />
            </div>
          ) : error ? (
            <div className="error-message">
              Error loading pending payments. Please try again.
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="empty-message">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
              <p>No pending payments to verify</p>
              <p className="empty-subtext">All payments have been processed</p>
            </div>
          ) : (
            <>
              <div className="payments-count">
                {pendingPayments.length} {pendingPayments.length === 1 ? 'Payment' : 'Payments'} Pending Verification
              </div>
              <div className="payments-table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>UTR</th>
                      <th>QR Code ID</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((payment) => (
                      <tr key={payment._id} className="payment-row">
                        <td className="user-cell">
                          <div className="user-info">
                            <div className="user-name">
                              {typeof payment.userId === 'object' 
                                ? payment.userId.name || 'N/A'
                                : 'N/A'}
                            </div>
                            <div className="user-email">
                              {typeof payment.userId === 'object' 
                                ? payment.userId.email 
                                : payment.userId}
                            </div>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <div className="amount-info">
                            {payment.amountINR ? (
                              <>
                                <span className="amount-inr">₹{payment.amountINR}</span>
                                <span className="amount-gc">({payment.amountGC} GC)</span>
                              </>
                            ) : (
                              <span className="amount-gc">{payment.amountGC} GC</span>
                            )}
                          </div>
                        </td>
                        <td className="status-cell">
                          <Badge
                            type="status"
                            variant={payment.status?.toLowerCase() || 'pending'}
                          >
                            {payment.status === 'fail' ? 'Failed' : 
                             payment.status === 'pending' ? 'Pending' :
                             payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'Pending'}
                          </Badge>
                          {payment.paymentVerified && (
                            <Badge type="status" variant="completed" className="verified-badge">
                              Verified
                            </Badge>
                          )}
                        </td>
                        <td className="utr-cell">
                          {payment.utr ? (
                            <code className="utr-code">{payment.utr}</code>
                          ) : (
                            <span className="no-utr">No UTR</span>
                          )}
                        </td>
                        <td className="qr-code-id-cell">
                          {payment.qrCodeId ? (
                            <code className="qr-code-id">{payment.qrCodeId}</code>
                          ) : (
                            <span className="no-qr">N/A</span>
                          )}
                        </td>
                        <td className="date-cell">{formatDate(payment.createdAt)}</td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApproveClick(payment)}
                              disabled={updatePaymentStatusMutation.isPending}
                              title="Approve Payment"
                              icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRejectClick(payment)}
                              disabled={updatePaymentStatusMutation.isPending}
                              title="Reject Payment"
                              icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onCancel={() => {
          setShowApproveModal(false);
          setSelectedPayment(null);
        }}
        onConfirm={handleApproveConfirm}
        title="Approve Payment"
        message={
          selectedPayment ? (
            <div>
              <p>Are you sure you want to approve this payment?</p>
              <div className="detail-box">
                <p><strong>User:</strong> {
                  typeof selectedPayment.userId === 'object'
                    ? selectedPayment.userId.name || selectedPayment.userId.email
                    : selectedPayment.userId
                }</p>
                <p><strong>Amount:</strong> {
                  selectedPayment.amountINR 
                    ? `₹${selectedPayment.amountINR} (${selectedPayment.amountGC} GC)`
                    : `${selectedPayment.amountGC} GC`
                }</p>
                {selectedPayment.utr && (
                  <p><strong>UTR:</strong> {selectedPayment.utr}</p>
                )}
                {selectedPayment.qrCodeId && (
                  <p><strong>QR Code ID:</strong> {selectedPayment.qrCodeId}</p>
                )}
              </div>
            </div>
          ) : ''
        }
        confirmText={updatePaymentStatusMutation.isPending ? 'Approving...' : 'Approve'}
        cancelText="Cancel"
      />

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedPayment(null);
          setRejectReason('');
        }}
        title="Reject Payment"
        showCloseButton={true}
      >
        <div className="reject-modal-content">
          <p className="reject-message">
            Are you sure you want to reject this payment?
          </p>
          {selectedPayment && (
            <div className="payment-details">
              <div className="detail-row">
                <span className="detail-label">User:</span>
                <span className="detail-value">
                  {typeof selectedPayment.userId === 'object'
                    ? selectedPayment.userId.name || selectedPayment.userId.email
                    : selectedPayment.userId}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">
                  {selectedPayment.amountINR 
                    ? `₹${selectedPayment.amountINR} (${selectedPayment.amountGC} GC)`
                    : `${selectedPayment.amountGC} GC`
                  }
                </span>
              </div>
              {selectedPayment.utr && (
                <div className="detail-row">
                  <span className="detail-label">UTR:</span>
                  <span className="detail-value">{selectedPayment.utr}</span>
                </div>
              )}
              {selectedPayment.qrCodeId && (
                <div className="detail-row">
                  <span className="detail-label">QR Code ID:</span>
                  <span className="detail-value">{selectedPayment.qrCodeId}</span>
                </div>
              )}
              {selectedPayment.paymentId && (
                <div className="detail-row">
                  <span className="detail-label">Payment ID:</span>
                  <span className="detail-value">{selectedPayment.paymentId}</span>
                </div>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="reject-reason" className="form-label">
              Reason for Rejection (Optional)
            </label>
            <textarea
              id="reject-reason"
              className="form-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={3}
                disabled={updatePaymentStatusMutation.isPending}
            />
          </div>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedPayment(null);
                setRejectReason('');
              }}
              disabled={updatePaymentStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectConfirm}
              disabled={updatePaymentStatusMutation.isPending}
              loading={updatePaymentStatusMutation.isPending}
            >
              Reject Payment
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default PaymentVerificationPage;
