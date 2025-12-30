import React from 'react';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import Loading from '@components/common/Loading';
import type { TopUpHistoryItem } from '@services/api/wallet.api';
import type { UseWalletLogicReturn } from './Wallet.types';

interface WalletHistoryProps {
  history: TopUpHistoryItem[];
  historyLoading: boolean;
  pagination: UseWalletLogicReturn['pagination'];
  historyPage: number;
  setHistoryPage: (page: number) => void;
  formatDate: (dateString: string) => string;
  maskPaymentId: (paymentId: string) => string;
  handleCopyPaymentId: (paymentId: string, e: React.MouseEvent) => void;
}

const WalletHistory: React.FC<WalletHistoryProps> = ({
  history,
  historyLoading,
  pagination,
  historyPage,
  setHistoryPage,
  formatDate,
  maskPaymentId,
  handleCopyPaymentId,
}) => {
  return (
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
            (t: TopUpHistoryItem) => t.status === 'pending'
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
                        <Badge
                          type="type"
                          variant={transaction.type}
                        >
                          {transaction.type === 'topup'
                            ? 'Top Up'
                            : transaction.type === 'deduction'
                            ? 'Deduction'
                            : 'Refund'}
                        </Badge>
                      </td>
                      <td
                        className={`amount-cell ${
                          transaction.type === 'deduction'
                            ? 'negative'
                            : 'positive'
                        }`}
                      >
                        {transaction.type === 'deduction' ? '-' : '+'}
                        {transaction.amountGC.toLocaleString('en-IN')}
                      </td>
                      <td className="status-cell">
                        <Badge
                          type="status"
                          variant={
                            transaction.status === 'fail'
                              ? 'failed'
                              : transaction.status.toLowerCase()
                          }
                        >
                          {transaction.status === 'fail'
                            ? 'Failed'
                            : transaction.status === 'pending'
                            ? 'Pending'
                            : transaction.status === 'completed'
                            ? 'Completed'
                            : transaction.status.charAt(0).toUpperCase() +
                              transaction.status.slice(1)}
                        </Badge>
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
                        {transaction.description || '-'}
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                disabled={!pagination.hasPrevPage || historyLoading}
                title="Previous Page"
                icon={
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
                }
              >
                Previous
              </Button>

              <div className="pagination-info">
                <span>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <span className="pagination-count">
                  ({pagination.totalItems} total items)
                </span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHistoryPage(historyPage + 1)}
                disabled={!pagination.hasNextPage || historyLoading}
                title="Next Page"
                icon={
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
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="no-history">
          <p>No transaction history available</p>
        </div>
      )}
    </div>
  );
};

export default WalletHistory;
