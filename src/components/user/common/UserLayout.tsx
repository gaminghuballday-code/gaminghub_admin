import { useState } from 'react';
import { useSidebarSync } from '@hooks/useSidebarSync';
import AppHeaderActions from '@components/common/AppHeaderActions';
import UserSidebar from './UserSidebar';
import './UserLayout.scss';

interface UserLayoutProps {
  children: React.ReactNode;
  title: string;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className={`user-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <UserSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <main className="user-main">
        <header className="user-header">
          <div className="header-left">
            <h1>{title}</h1>
          </div>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
