import { useState } from 'react';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import { useWalletBalance, useTopUpHistory, useTopUpWallet } from '@services/api/hooks/useWalletQueries';
import type { TopUpHistoryItem } from '@services/api/wallet.api';
import './Wallet.scss';

const UserWallet: React.FC = () => {
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useWalletBalance();
  const { data: history, isLoading: historyLoading } = useTopUpHistory();
  const topUpMutation = useTopUpWallet();

  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDescription, setTopUpDescription] = useState('');
  const [showTopUpForm, setShowTopUpForm] = useState(false);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    topUpMutation.mutate(
      {
        amountGC: amount,
        description: topUpDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setTopUpAmount('');
          setTopUpDescription('');
          setShowTopUpForm(false);
        },
      }
    );
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
            {showTopUpForm && (
              <form className="topup-form" onSubmit={handleTopUp}>
                <div className="form-group">
                  <label htmlFor="amount" className="form-label">
                    Amount (GC)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    className="form-input"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    required
                    disabled={topUpMutation.isPending}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    id="description"
                    className="form-input"
                    value={topUpDescription}
                    onChange={(e) => setTopUpDescription(e.target.value)}
                    placeholder="Add description"
                    disabled={topUpMutation.isPending}
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowTopUpForm(false);
                      setTopUpAmount('');
                      setTopUpDescription('');
                    }}
                    disabled={topUpMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={topUpMutation.isPending || !topUpAmount || parseFloat(topUpAmount) <= 0}
                  >
                    {topUpMutation.isPending ? 'Processing...' : 'Top Up'}
                  </button>
                </div>
              </form>
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

