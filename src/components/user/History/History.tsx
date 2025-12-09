import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import './History.scss';

const UserHistory: React.FC = () => {
  return (
    <div className="user-history-container">
      <UserSidebar />

      <main className="user-main">
        <header className="user-header">
          <h1>History</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="history-card">
            <h2 className="card-title">Your History</h2>
            <p className="card-content">Your gaming history will be displayed here.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserHistory;

