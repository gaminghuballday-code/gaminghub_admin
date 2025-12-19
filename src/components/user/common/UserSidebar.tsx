import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import { USER_ROUTES } from '@utils/constants';
import './UserSidebar.scss';

interface UserSidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ sidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const user = useAppSelector(selectUser);

  return (
    <aside className={`user-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Booyahx</h2>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <Link 
          to={USER_ROUTES.HOME} 
          className={`nav-item ${location.pathname === USER_ROUTES.HOME ? 'active' : ''}`}
        >
          <span className="nav-icon">🏠</span>
          {sidebarOpen && <span className="nav-text">Home</span>}
        </Link>
        <Link 
          to={USER_ROUTES.TOURNAMENTS} 
          className={`nav-item ${location.pathname === USER_ROUTES.TOURNAMENTS ? 'active' : ''}`}
        >
          <span className="nav-icon">🎮</span>
          {sidebarOpen && <span className="nav-text">Tournaments</span>}
        </Link>
        <Link 
          to={USER_ROUTES.LOBBY} 
          className={`nav-item ${location.pathname === USER_ROUTES.LOBBY ? 'active' : ''}`}
        >
          <span className="nav-icon">🎯</span>
          {sidebarOpen && <span className="nav-text">Lobby</span>}
        </Link>
        <Link 
          to={USER_ROUTES.HISTORY} 
          className={`nav-item ${location.pathname === USER_ROUTES.HISTORY ? 'active' : ''}`}
        >
          <span className="nav-icon">📜</span>
          {sidebarOpen && <span className="nav-text">History</span>}
        </Link>
        <Link 
          to={USER_ROUTES.WALLET} 
          className={`nav-item ${location.pathname === USER_ROUTES.WALLET ? 'active' : ''}`}
        >
          <span className="nav-icon">💰</span>
          {sidebarOpen && <span className="nav-text">Wallet</span>}
        </Link>
        <Link 
          to={USER_ROUTES.PROFILE} 
          className={`nav-item ${location.pathname === USER_ROUTES.PROFILE ? 'active' : ''}`}
        >
          <span className="nav-icon">👤</span>
          {sidebarOpen && <span className="nav-text">Profile</span>}
        </Link>
      </nav>

      <div className="sidebar-footer">
        {sidebarOpen && user && (
          <div className="user-info">
            <div className="user-email">{user.email}</div>
            {user.name && <div className="user-name">{user.name}</div>}
          </div>
        )}
      </div>
    </aside>
  );
};

export default UserSidebar;

