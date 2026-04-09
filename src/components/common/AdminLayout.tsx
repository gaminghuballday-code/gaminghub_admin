import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link, matchPath } from 'react-router-dom';
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

interface NavLinkItem {
  type: 'link';
  path: string;
  icon: string;
  label: string;
}

interface NavGroupItem {
  type: 'group';
  id: string;
  icon: string;
  label: string;
  children: NavLinkItem[];
}

type NavItem = NavLinkItem | NavGroupItem;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const user = useAppSelector(selectUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const navItems: NavItem[] = useMemo(
    () => [
      { type: 'link', path: ROUTES.DASHBOARD, icon: '📊', label: 'Dashboard' },
      {
        type: 'group',
        id: 'room-creator',
        icon: '🎮',
        label: 'Room Creator',
        children: [
          { type: 'link', path: ROUTES.GENERATE_LOBBY_LOBBIES, icon: '🎯', label: 'Lobbies' },
          { type: 'link', path: ROUTES.GENERATE_LOBBY_SPECIAL_TOURNAMENT, icon: '🏆', label: ' Tournament' },
        ],
      },
      {
        type: 'group',
        id: 'money',
        icon: '💰',
        label: 'Bank Account',
        children: [
          { type: 'link', path: ROUTES.TOP_UP, icon: '💰', label: 'Top Up' },
          { type: 'link', path: ROUTES.PAYMENT_VERIFICATION, icon: '✅', label: 'Mannul Check' },
          { type: 'link', path: ROUTES.WITHDRAWALS, icon: '💸', label: 'Withdrawals' },
          { type: 'link', path: ROUTES.USER_HISTORY, icon: '📜', label: 'User Record' },
        ],
      },
      { type: 'link', path: ROUTES.HOST_CREATION, icon: '👤', label: 'Account Creation' },
      {
        type: 'group',
        id: 'user-queries',
        icon: '💬',
        label: 'User Queries',
        children: [
          { type: 'link', path: ROUTES.SUPPORT_TICKETS, icon: '🎫', label: 'Support Tickets' },
          { type: 'link', path: ROUTES.ENQUIRIES, icon: '📧', label: 'Enquiries' },
        ],
      },
      { type: 'link', path: ROUTES.NOTIFICATIONS, icon: '🔔', label: 'Notifications' },
    ],
    []
  );

  const isPathActive = (path: string) =>
    matchPath({ path, end: false }, location.pathname) !== null;

  const isGroupActive = (item: NavGroupItem) =>
    item.children.some((child) => isPathActive(child.path));

  useEffect(() => {
    const idsToOpen = navItems
      .filter((x): x is NavGroupItem => x.type === 'group')
      .filter((group) => isGroupActive(group))
      .map((group) => group.id);
    if (idsToOpen.length === 0) return;
    setOpenGroups((prev) => {
      const next = { ...prev };
      idsToOpen.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [location.pathname, navItems]);

  const isGroupOpen = (groupId: string) => openGroups[groupId] ?? false;

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !(prev[groupId] ?? false) }));
  };

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
            if (item.type === 'group') {
              const active = isGroupActive(item);
              const open = isGroupOpen(item.id);
              return (
                <div key={item.id} className="nav-group">
                  <button
                    type="button"
                    className={`nav-item nav-group-toggle ${active ? 'active' : ''}`}
                    onClick={() => toggleGroup(item.id)}
                    aria-expanded={open}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {sidebarOpen && <span className="nav-text">{item.label}</span>}
                    {sidebarOpen && (
                      <span className={`nav-caret ${open ? 'open' : ''}`} aria-hidden="true">
                        ▾
                      </span>
                    )}
                  </button>

                  <div className={`nav-subitems ${open ? 'open' : 'closed'}`}>
                    {item.children.map((child) => {
                      const childActive = isPathActive(child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`nav-item nav-subitem ${childActive ? 'active' : ''}`}
                          onClick={(e) => {
                            if (childActive) e.preventDefault();
                          }}
                        >
                          <span className="nav-icon">{child.icon}</span>
                          {sidebarOpen && <span className="nav-text">{child.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = isPathActive(item.path);
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

