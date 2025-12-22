import { useUserHistoryPageLogic } from './UserHistoryPage.logic';
import AdminLayout from '@components/common/AdminLayout';
import { Modal } from '@components/common/Modal';
import './UserHistoryPage.scss';

const UserHistoryPage: React.FC = () => {
  const {
    emailQuery,
    selectedUser,
    searchLoading,
    handleEmailSearch,
    handleSearchByEmail,
    showTransactionModal,
    modalTransactions,
    modalTransactionsLoading,
    modalTransactionsError,
    modalTotalTransactions,
    modalTotalPages,
    transactionPage,
    handleOpenTransactionModal,
    handleCloseTransactionModal,
    handleTransactionPageChange,
  } = useUserHistoryPageLogic();

  return (
    <AdminLayout title="User Transaction History">
      <div className="user-history-content-wrapper">
          {/* Search Section */}
          <div className="user-history-card">
            <h2 className="card-title">Search User by Email</h2>
            <div className="search-section">
              <div className="search-input-group">
                <input
                  type="email"
                  className="search-input"
                  placeholder="Enter user email..."
                  value={emailQuery}
                  onChange={(e) => handleEmailSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchByEmail();
                    }
                  }}
                  disabled={searchLoading}
                />
                <button
                  className="search-button"
                  onClick={handleSearchByEmail}
                  disabled={searchLoading || !emailQuery.trim()}
                >
                  {searchLoading ? 'Searching...' : '🔍 SEARCH'}
                </button>
              </div>
            </div>

            {/* Selected User Info */}
            {selectedUser && (
              <div className="selected-user-info">
                <h3>User Information</h3>
                <div className="user-details">
                  <div className="user-detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedUser.name || 'N/A'}</span>
                  </div>
                  <div className="user-detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                  <div className="user-detail-item">
                    <span className="detail-label">Balance GC:</span>
                    <span className="detail-value">{selectedUser.balanceGC ?? 0}</span>
                  </div>
                  <div className="user-detail-item">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{selectedUser.role || 'N/A'}</span>
                  </div>
                </div>
                <button
                  className="transaction-history-button"
                  onClick={handleOpenTransactionModal}
                  type="button"
                >
                  Transaction History
                </button>
              </div>
            )}
          </div>

          {/* Transactions Section */}
          
        </div>

      {/* Transaction History Modal */}
      {selectedUser && (
        <Modal
          isOpen={showTransactionModal}
          onClose={handleCloseTransactionModal}
          className="modal-large"
          title={`Transaction History - ${selectedUser.name || selectedUser.email}`}
          showCloseButton={true}
        >
          <div className="transaction-modal-content">
            {modalTransactionsError && (
              <div className="error-message">
                <p>{modalTransactionsError}</p>
              </div>
            )}

            {modalTransactionsLoading ? (
              <div className="loading-message">
                <p>Loading transactions...</p>
              </div>
            ) : modalTransactions.length > 0 ? (
              <>
                <div className="transactions-table-wrapper">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Amount (GC)</th>
                        <th>Status</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalTransactions.map((transaction) => (
                        <tr key={transaction._id || `${transaction.userId}-${transaction.createdAt}`}>
                          <td>
                            {transaction.createdAt
                              ? new Date(transaction.createdAt).toLocaleString('en-IN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'N/A'}
                          </td>
                          <td className="amount-cell">
                            <span className={`amount ${transaction.status === 'success' ? 'success' : 'fail'}`}>
                              {transaction.status === 'success' ? '+' : ''}{transaction.amountGC} GC
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${transaction.status === 'success' ? 'success' : 'fail'}`}>
                              {transaction.status === 'success' ? '✓ Success' : '✗ Failed'}
                            </span>
                          </td>
                          <td className="description-cell">
                            {transaction.description || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {modalTotalPages > 1 && (
                  <div className="transaction-modal-pagination">
                    <div className="pagination-info">
                      <span className="pagination-text">
                        Page {transactionPage} of {modalTotalPages}
                      </span>
                      {modalTotalTransactions > 0 && (
                        <span className="pagination-total">
                          (Showing {((transactionPage - 1) * 10) + 1}-{Math.min(transactionPage * 10, modalTotalTransactions)} of {modalTotalTransactions} transactions)
                        </span>
                      )}
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="pagination-button"
                        onClick={() => handleTransactionPageChange(transactionPage - 1)}
                        disabled={transactionPage <= 1 || modalTransactionsLoading}
                        type="button"
                      >
                        Previous
                      </button>
                      <button
                        className="pagination-button"
                        onClick={() => handleTransactionPageChange(transactionPage + 1)}
                        disabled={transactionPage >= modalTotalPages || modalTransactionsLoading}
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-message">
                <p>No transactions found for this user.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default UserHistoryPage;

