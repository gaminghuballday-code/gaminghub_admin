import { Link } from 'react-router-dom';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import { USER_ROUTES } from '@utils/constants';
import './Home.scss';

const UserHome: React.FC = () => {
  const user = useAppSelector(selectUser);

  return (
    <div className="user-home-container">
      <UserSidebar />

      <main className="user-main">
        <header className="user-header">
          <h1>Welcome to Booyahx</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="welcome-card">
            <h2 className="card-title">Welcome Back!</h2>
            <p className="card-content">
              {user ? `Hello, ${user.name || user.email}!` : 'Welcome to Booyahx'}
            </p>
            <p className="card-content-secondary">
              Join tournaments, compete with players, and win amazing prizes.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3 className="feature-title">Tournaments</h3>
              <p className="feature-description">
                Join exciting tournaments and compete with players from around the world.
              </p>
              <Link to={USER_ROUTES.TOURNAMENTS} className="feature-link">
                View Tournaments →
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Lobby</h3>
              <p className="feature-description">
                Create or join game lobbies and play with friends.
              </p>
              <Link to={USER_ROUTES.LOBBY} className="feature-link">
                Go to Lobby →
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Wallet</h3>
              <p className="feature-description">
                Manage your gaming credits and transactions.
              </p>
              <Link to={USER_ROUTES.WALLET} className="feature-link">
                View Wallet →
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📜</div>
              <h3 className="feature-title">History</h3>
              <p className="feature-description">
                View your gaming history and past tournaments.
              </p>
              <Link to={USER_ROUTES.HISTORY} className="feature-link">
                View History →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserHome;

