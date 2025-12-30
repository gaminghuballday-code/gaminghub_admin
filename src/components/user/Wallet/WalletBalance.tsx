import React from 'react';
import { Button } from '@components/common/Button';
import Loading from '@components/common/Loading';
import type { UseWalletLogicReturn } from './Wallet.types';

interface WalletBalanceProps {
  balance: number | undefined;
  balanceLoading: boolean;
  refetchBalance: () => void;
  showTopUpForm: boolean;
  setShowTopUpForm: (show: boolean) => void;
  topUpAmount: string;
  amountError: string;
  isProcessing: boolean;
  createQRCodeMutation: UseWalletLogicReturn['createQRCodeMutation'];
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleQRCodePayment: (e: React.FormEvent) => void;
  resetQRCodePayment: () => void;
  handleWithdrawClick: () => void;
  qrCodeId: string | null;
  paymentStep: 'qr' | 'payment' | 'submitted';
}

const WalletBalance: React.FC<WalletBalanceProps> = ({
  balance,
  balanceLoading,
  refetchBalance,
  showTopUpForm,
  setShowTopUpForm,
  topUpAmount,
  amountError,
  isProcessing,
  createQRCodeMutation,
  handleAmountChange,
  handleQRCodePayment,
  resetQRCodePayment,
  handleWithdrawClick,
  qrCodeId,
  paymentStep,
}) => {
  return (
    <div className="wallet-card balance-card">
      <div className="card-header">
        <h2 className="card-title">Wallet Balance</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetchBalance()}
          disabled={balanceLoading}
          loading={balanceLoading}
          title="Refresh Balance"
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
        />
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
                {balance?.toLocaleString('en-IN') ?? 0} GC
              </span>
            </div>
            <div className="wallet-action-buttons">
              <Button
                variant="primary"
                onClick={() => setShowTopUpForm(!showTopUpForm)}
              >
                {showTopUpForm ? 'Cancel' : 'Top Up'}
              </Button>
              <Button
                variant="danger"
                onClick={handleWithdrawClick}
              >
                Withdraw
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Top Up Form */}
      {showTopUpForm && (!qrCodeId || paymentStep === 'qr') && (
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
              <small className="form-error">
                {amountError}
              </small>
            )}
            <small className="form-hint">
              1 INR = 1 GC. You will receive{' '}
              {topUpAmount ? parseFloat(topUpAmount) || 0 : 0} GC after
              payment. Minimum top-up: ₹1
            </small>
          </div>
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowTopUpForm(false);
                resetQRCodePayment();
              }}
              disabled={
                isProcessing ||
                createQRCodeMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isProcessing || createQRCodeMutation.isPending}
              disabled={
                !topUpAmount ||
                parseFloat(topUpAmount) < 1 ||
                !!amountError
              }
            >
              Generate QR Code
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WalletBalance;
