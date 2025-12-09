import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import './Wallet.scss';

const UserWallet: React.FC = () => {
  const user = useAppSelector(selectUser);

  return (
    <div className="user-wallet-container">
      <UserSidebar />

      <main className="user-main">
        <header className="user-header">
          <h1>Wallet</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="wallet-card">
            <h2 className="card-title">Your Wallet</h2>
            <div className="balance-display">
              <span className="balance-label">Balance (GC):</span>
              <span className="balance-amount">{user?.balanceGC ?? 0}</span>
            </div>
            <p className="card-content">Transaction history and top-up options will be displayed here.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserWallet;

