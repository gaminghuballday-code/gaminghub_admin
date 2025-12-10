import { useAppDispatch, useAppSelector } from '@store/hooks';
import { selectTheme, toggleTheme } from '@store/slices/themeSlice';
import { Modal } from './Modal';
import './SettingsModal.scss';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="modal-small"
      title="Settings"
      showCloseButton={true}
    >
      <div className="settings-modal-content">
          <div className="settings-option">
            <div className="settings-option-label">
              <span className="settings-option-icon">
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
              <div className="settings-option-text">
                <div className="settings-option-title">Theme</div>
                <div className="settings-option-description">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
              </div>
            </div>
            <button
              className={`theme-toggle ${theme === 'dark' ? 'dark' : 'light'}`}
              onClick={handleThemeToggle}
              aria-label="Toggle theme"
            >
              <div className="theme-toggle-slider"></div>
            </button>
          </div>
        </div>
    </Modal>
  );
};

export default SettingsModal;

