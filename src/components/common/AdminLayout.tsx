import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import { useSidebarSync } from '@hooks/useSidebarSync';
import AppHeaderActions from '@components/common/AppHeaderActions';
import './AdminLayout.scss';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const user = useAppSelector(selectUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const navItems = [
    { path: ROUTES.DASHBOARD, icon: '📊', label: 'Dashboard' },
    { path: ROUTES.GENERATE_LOBBY, icon: '🎮', label: 'Room Creator' },
    { path: ROUTES.TOP_UP, icon: '💰', label: 'Top Up' },
    { path: ROUTES.PAYMENT_VERIFICATION, icon: '✅', label: 'Payment Verification' },
    { path: ROUTES.WITHDRAWALS, icon: '💸', label: 'Withdrawals' },
    { path: ROUTES.HOST_CREATION, icon: '👤', label: 'Host Creation' },
    { path: ROUTES.USER_HISTORY, icon: '📜', label: 'User History' },
    { path: ROUTES.ENQUIRIES, icon: '📧', label: 'Enquiries' },
    { path: ROUTES.SUPPORT_TICKETS, icon: '🎫', label: 'Support Tickets' },
    { path: ROUTES.NOTIFICATIONS, icon: '🔔', label: 'Notifications' },
  ];

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">BX</h2>
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  if (isActive) {
                    e.preventDefault();
                  }
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-text">{item.label}</span>}
              </Link>
            );
          })}
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

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h1>{title}</h1>
          </div>
          <AppHeaderActions />
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

