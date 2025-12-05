import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '@services/api/hooks';
import ThemeToggle from '@components/common/ThemeToggle';
import SettingsModal from '@components/common/SettingsModal';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { ROUTES } from '@utils/constants';
import './AppHeaderActions.scss';

const AppHeaderActions: React.FC = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const logoutMutation = useLogout();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const dropdown = dropdownRef.current.querySelector('.dropdown-menu');
        dropdown?.classList.remove('open');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogoutConfirm = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      <div className="header-actions">
        <ThemeToggle />
        <div className="settings-dropdown" ref={dropdownRef}>
          <button 
            className="settings-button"
            onClick={(e) => {
              e.stopPropagation();
              const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
              dropdown?.classList.toggle('open');
            }}
            aria-label="Settings"
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
            </svg>
          </button>
          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <button 
              className="dropdown-item" 
              onClick={() => {
                const dropdown = dropdownRef.current?.querySelector('.dropdown-menu');
                dropdown?.classList.remove('open');
                navigate(ROUTES.PROFILE);
              }}
            >
              <span className="dropdown-icon">👤</span>
              <span>Profile</span>
            </button>
            <button 
              className="dropdown-item" 
              onClick={() => {
                const dropdown = dropdownRef.current?.querySelector('.dropdown-menu');
                dropdown?.classList.remove('open');
                navigate(ROUTES.HEALTH);
              }}
            >
              <span className="dropdown-icon">❤️</span>
              <span>Health Status</span>
            </button>
            <button 
              className="dropdown-item" 
              onClick={() => {
                const dropdown = dropdownRef.current?.querySelector('.dropdown-menu');
                dropdown?.classList.remove('open');
                setShowSettingsModal(true);
              }}
            >
              <span className="dropdown-icon">⚙️</span>
              <span>Settings</span>
            </button>
            <button 
              className="dropdown-item" 
              onClick={() => {
                setShowLogoutModal(true);
                const dropdown = dropdownRef.current?.querySelector('.dropdown-menu');
                dropdown?.classList.remove('open');
              }}
            >
              <span className="dropdown-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
};

export default AppHeaderActions;

