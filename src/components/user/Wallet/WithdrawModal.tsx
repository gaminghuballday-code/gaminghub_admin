import React from 'react';
import Modal from '@components/common/Modal/Modal';
import { Button } from '@components/common/Button';
import type { UseWalletLogicReturn } from './Wallet.types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number | undefined;
  withdrawAmount: string;
  withdrawError: string;
  user: UseWalletLogicReturn['user'];
  handleWithdrawAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxWithdrawClick: () => void;
  handleWithdrawSubmit: (e: React.FormEvent) => void;
  withdrawWalletMutation: UseWalletLogicReturn['withdrawWalletMutation'];
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  balance,
  withdrawAmount,
  withdrawError,
  user,
  handleWithdrawAmountChange,
  handleMaxWithdrawClick,
  handleWithdrawSubmit,
  withdrawWalletMutation,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleMaxWithdrawClick}
              disabled={
                withdrawWalletMutation.isPending || !balance || balance <= 0
              }
              title={`Max: ${balance?.toLocaleString('en-IN') ?? 0} GC`}
            >
              Max
            </Button>
          </div>
          {withdrawError && (
            <small className="form-error">
              {withdrawError}
            </small>
          )}
          <small className="form-hint">
            Available balance: {balance?.toLocaleString('en-IN') ?? 0} GC
          </small>
          {user?.paymentUPI && (
            <small className="form-hint form-hint-block">
              Funds will be sent to: {user.paymentUPI}
            </small>
          )}
        </div>
        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={withdrawWalletMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={withdrawWalletMutation.isPending}
            disabled={
              !withdrawAmount ||
              parseFloat(withdrawAmount) <= 0 ||
              !balance ||
              parseFloat(withdrawAmount) > balance ||
              !!withdrawError
            }
          >
            Withdraw
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WithdrawModal;
