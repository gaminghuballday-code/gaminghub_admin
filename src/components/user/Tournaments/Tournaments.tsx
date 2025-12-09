import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import './Tournaments.scss';

const UserTournaments: React.FC = () => {
  return (
    <div className="user-tournaments-container">
      <UserSidebar />

      <main className="user-main">
        <header className="user-header">
          <h1>Tournaments</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="tournaments-card">
            <h2 className="card-title">Available Tournaments</h2>
            <p className="card-content">Tournament listings will be displayed here.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserTournaments;

