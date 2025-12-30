import React from 'react';
import UserLayout from '@components/user/common/UserLayout';
import { useWalletLogic } from './Wallet.logic';
import WalletBalance from './WalletBalance';
import WalletHistory from './WalletHistory';
import QRPaymentModal from './QRPaymentModal';
import WithdrawModal from './WithdrawModal';
import './Wallet.scss';

const UserWallet: React.FC = () => {
  const {
    // Balance
    balance,
    balanceLoading,
    refetchBalance,
    
    // History
    history,
    historyLoading,
    pagination,
    historyPage,
    setHistoryPage,
    
    // Top-up form
    topUpAmount,
    showTopUpForm,
    setShowTopUpForm,
    isProcessing,
    amountError,
    handleAmountChange,
    handleQRCodePayment,
    createQRCodeMutation,
    
    // QR Payment
    qrPaymentState,
    showQRPaymentModal,
    setShowQRPaymentModal,
    resetQRCodePayment,
    handleUTRChange,
    handleUTRSubmit,
    confirmPaymentMutation,
    closeQRCodeMutation,
    formatTimeRemaining,
    
    // Withdraw
    showWithdrawModal,
    setShowWithdrawModal,
    withdrawAmount,
    withdrawError,
    handleWithdrawClick,
    handleWithdrawAmountChange,
    handleMaxWithdrawClick,
    handleWithdrawSubmit,
    withdrawWalletMutation,
    
    // Utils
    formatDate,
    maskPaymentId,
    handleCopyPaymentId,
    user,
  } = useWalletLogic();

  const handleWithdrawModalClose = () => {
    setShowWithdrawModal(false);
  };

  const handleQRPaymentModalClose = () => {
    setShowQRPaymentModal(false);
  };

  return (
    <UserLayout title="Wallet">
      <div className="wallet-page-content">
        <WalletBalance
          balance={balance}
          balanceLoading={balanceLoading}
          refetchBalance={refetchBalance}
          showTopUpForm={showTopUpForm}
          setShowTopUpForm={setShowTopUpForm}
          topUpAmount={topUpAmount}
          amountError={amountError}
          isProcessing={isProcessing}
          createQRCodeMutation={createQRCodeMutation}
          handleAmountChange={handleAmountChange}
          handleQRCodePayment={handleQRCodePayment}
          resetQRCodePayment={resetQRCodePayment}
          handleWithdrawClick={handleWithdrawClick}
          qrCodeId={qrPaymentState.qrCodeId}
          paymentStep={qrPaymentState.paymentStep}
        />

        <QRPaymentModal
          isOpen={showQRPaymentModal}
          onClose={handleQRPaymentModalClose}
          qrPaymentState={qrPaymentState}
          formatTimeRemaining={formatTimeRemaining}
          handleUTRChange={handleUTRChange}
          handleUTRSubmit={handleUTRSubmit}
          confirmPaymentMutation={confirmPaymentMutation}
          closeQRCodeMutation={closeQRCodeMutation}
          resetQRCodePayment={resetQRCodePayment}
        />

        <WalletHistory
          history={history}
          historyLoading={historyLoading}
          pagination={pagination}
          historyPage={historyPage}
          setHistoryPage={setHistoryPage}
          formatDate={formatDate}
          maskPaymentId={maskPaymentId}
          handleCopyPaymentId={handleCopyPaymentId}
        />

        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={handleWithdrawModalClose}
          balance={balance}
          withdrawAmount={withdrawAmount}
          withdrawError={withdrawError}
          user={user}
          handleWithdrawAmountChange={handleWithdrawAmountChange}
          handleMaxWithdrawClick={handleMaxWithdrawClick}
          handleWithdrawSubmit={handleWithdrawSubmit}
          withdrawWalletMutation={withdrawWalletMutation}
        />
      </div>
    </UserLayout>
  );
};

export default UserWallet;
