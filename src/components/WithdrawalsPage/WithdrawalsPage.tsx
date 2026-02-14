import React, { useState } from 'react';
import AdminLayout from '@components/common/AdminLayout';
import Loading from '@components/common/Loading';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import {
  useWithdrawalsList,
  useUpdateWithdrawalStatus,
} from '@services/api/hooks/useWithdrawalsQueries';
import type { WithdrawalRequest } from '@services/api/withdrawals.api';
import './WithdrawalsPage.scss';

const WithdrawalsPage: React.FC = () => {
  const { data: withdrawalsData, isLoading, error, refetch } =
    useWithdrawalsList();
  const updateStatusMutation = useUpdateWithdrawalStatus();

  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const withdrawals =
    withdrawalsData?.data?.withdrawals ||
    withdrawalsData?.data?.withdrawalRequests ||
    [];

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

  const getUserDisplay = (userId: WithdrawalRequest['userId']) => {
    if (typeof userId === 'object') {
      return userId.name || userId.email || 'N/A';
    }
    return userId;
  };

  const getUserEmail = (userId: WithdrawalRequest['userId']) => {
    if (typeof userId === 'object') {
      return userId.email;
    }
    return userId;
  };

  const getUserUPI = (userId: WithdrawalRequest['userId']) => {
    if (typeof userId === 'object' && 'paymentUPI' in userId) {
      return userId.paymentUPI;
    }
    return undefined;
  };

  const handleApproveClick = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowApproveModal(true);
  };

  const handleRejectClick = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedWithdrawal) return;

    try {
      await updateStatusMutation.mutateAsync({
        transactionId: selectedWithdrawal._id,
        status: 'approved',
      });
      setShowApproveModal(false);
      setSelectedWithdrawal(null);
      refetch();
    } catch {
      // Error handling is done in the hook
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedWithdrawal) return;

    try {
      await updateStatusMutation.mutateAsync({
        transactionId: selectedWithdrawal._id,
        status: 'rejected',
      });
      setShowRejectModal(false);
      setSelectedWithdrawal(null);
      refetch();
    } catch {
      // Error handling is done in the hook
    }
  };

  const getStatusVariant = (
    status: string
  ): 'pending' | 'completed' | 'warning' | 'error' => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'completed') return 'completed';
    if (s === 'rejected' || s === 'failed') return 'error';
    return 'pending';
  };

  const pendingWithdrawals = withdrawals.filter(
    (w) => w.status?.toLowerCase() === 'pending'
  );

  return (
    <AdminLayout title="Withdrawal Requests">
      <div className="withdrawals-content-wrapper">
        <div className="withdrawals-card">
          <div className="card-header">
            <h2 className="card-title">User Withdrawal Requests</h2>
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
              Error loading withdrawal requests. Please try again.
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="empty-message">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
              <p>No withdrawal requests</p>
              <p className="empty-subtext">
                User withdrawal requests will appear here
              </p>
            </div>
          ) : (
            <>
              {pendingWithdrawals.length > 0 && (
                <div className="withdrawals-count">
                  {pendingWithdrawals.length}{' '}
                  {pendingWithdrawals.length === 1
                    ? 'Request'
                    : 'Requests'}{' '}
                  Pending Approval
                </div>
              )}
              <div className="withdrawals-table-wrapper">
                <table className="withdrawals-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Amount</th>
                      <th>UPI</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal._id} className="withdrawal-row">
                        <td className="user-cell">
                          <div className="user-info">
                            <div className="user-name">
                              {getUserDisplay(withdrawal.userId)}
                            </div>
                            <div className="user-email">
                              {getUserEmail(withdrawal.userId)}
                            </div>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <span className="amount-gc">
                            {withdrawal.amountGC} GC
                          </span>
                        </td>
                        <td className="upi-cell">
                          {getUserUPI(withdrawal.userId) ? (
                            <code className="upi-code">
                              {getUserUPI(withdrawal.userId)}
                            </code>
                          ) : (
                            <span className="no-upi">N/A</span>
                          )}
                        </td>
                        <td className="status-cell">
                          <Badge
                            type="status"
                            variant={getStatusVariant(
                              withdrawal.status
                            )}
                          >
                            {withdrawal.status === 'fail'
                              ? 'Failed'
                              : withdrawal.status?.charAt(0).toUpperCase() +
                                withdrawal.status?.slice(1) || 'Pending'}
                          </Badge>
                        </td>
                        <td className="date-cell">
                          {formatDate(withdrawal.createdAt)}
                        </td>
                        <td className="actions-cell">
                          {withdrawal.status?.toLowerCase() ===
                          'pending' ? (
                            <div className="action-buttons">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() =>
                                  handleApproveClick(withdrawal)
                                }
                                disabled={
                                  updateStatusMutation.isPending
                                }
                                title="Approve Withdrawal"
                                icon={
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  handleRejectClick(withdrawal)
                                }
                                disabled={
                                  updateStatusMutation.isPending
                                }
                                title="Reject Withdrawal"
                                icon={
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <line
                                      x1="18"
                                      y1="6"
                                      x2="6"
                                      y2="18"
                                    ></line>
                                    <line
                                      x1="6"
                                      y1="6"
                                      x2="18"
                                      y2="18"
                                    ></line>
                                  </svg>
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="no-actions">—</span>
                          )}
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

      <ConfirmationModal
        isOpen={showApproveModal}
        onCancel={() => {
          setShowApproveModal(false);
          setSelectedWithdrawal(null);
        }}
        onConfirm={handleApproveConfirm}
        title="Approve Withdrawal"
        message={
          selectedWithdrawal ? (
            <div>
              <p>Are you sure you want to approve this withdrawal?</p>
              <div className="detail-box">
                <p>
                  <strong>User:</strong>{' '}
                  {getUserDisplay(selectedWithdrawal.userId)}
                </p>
                <p>
                  <strong>Amount:</strong>{' '}
                  {selectedWithdrawal.amountGC} GC
                </p>
                {getUserUPI(selectedWithdrawal.userId) && (
                  <p>
                    <strong>UPI:</strong>{' '}
                    {getUserUPI(selectedWithdrawal.userId)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            ''
          )
        }
        confirmText={
          updateStatusMutation.isPending ? 'Approving...' : 'Approve'
        }
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={showRejectModal}
        onCancel={() => {
          setShowRejectModal(false);
          setSelectedWithdrawal(null);
        }}
        onConfirm={handleRejectConfirm}
        title="Reject Withdrawal"
        message={
          selectedWithdrawal ? (
            <div>
              <p>Are you sure you want to reject this withdrawal?</p>
              <div className="detail-box">
                <p>
                  <strong>User:</strong>{' '}
                  {getUserDisplay(selectedWithdrawal.userId)}
                </p>
                <p>
                  <strong>Amount:</strong>{' '}
                  {selectedWithdrawal.amountGC} GC
                </p>
                {getUserUPI(selectedWithdrawal.userId) && (
                  <p>
                    <strong>UPI:</strong>{' '}
                    {getUserUPI(selectedWithdrawal.userId)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            ''
          )
        }
        confirmText={
          updateStatusMutation.isPending ? 'Rejecting...' : 'Reject'
        }
        cancelText="Cancel"
      />
    </AdminLayout>
  );
};

export default WithdrawalsPage;
