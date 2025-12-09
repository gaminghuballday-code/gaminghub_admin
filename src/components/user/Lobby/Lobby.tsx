import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import './Lobby.scss';

const UserLobby: React.FC = () => {
  return (
    <div className="user-lobby-container">
      <UserSidebar />

      <main className="user-main">
        <header className="user-header">
          <h1>Lobby</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="lobby-card">
            <h2 className="card-title">Game Lobby</h2>
            <p className="card-content">Lobby features will be displayed here.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserLobby;

