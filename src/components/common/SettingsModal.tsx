import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import { addToast } from '@store/slices/toastSlice';
import { selectTheme, toggleTheme } from '@store/slices/themeSlice';
import {
  useAdminChangePassword,
  useAdminDevices,
  useAdminLogout,
  useAdminLogoutAll,
  useAdminProfile,
  useAdminUpdateProfile,
} from '@services/api/hooks';
import { authApi } from '@services/api/auth.api';
import type { TwoFactorSetupResponse } from '@services/types/api.types';
import { isAdminDomain } from '@utils/constants';
import { Modal } from './Modal';
import './SettingsModal.scss';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const theme = useAppSelector(selectTheme);
  const isAdmin = isAdminDomain();
  const [activeSection, setActiveSection] = useState('profile');
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phoneNumber: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [showDisable2faPassword, setShowDisable2faPassword] = useState(false);
  const [devicesPage, setDevicesPage] = useState(1);
  const devicesPerPage = 6;

  useAdminProfile(isOpen && isAdmin);
  const adminUpdateProfileMutation = useAdminUpdateProfile();
  const adminChangePasswordMutation = useAdminChangePassword();
  const adminLogoutMutation = useAdminLogout();
  const adminLogoutAllMutation = useAdminLogoutAll();
  const adminDevicesQuery = useAdminDevices(devicesPage, devicesPerPage, isOpen && isAdmin && activeSection === 'devices');
  const setupTwoFactorMutation = useMutation({
    mutationFn: () => authApi.setupTwoFactor(),
    onSuccess: (data) => {
      setTwoFactorSetup(data);
    },
  });
  const enableTwoFactorMutation = useMutation({
    mutationFn: (code: string) => authApi.enableTwoFactor(code),
    onSuccess: () => {
      setIs2faEnabled(true);
      setTwoFactorCode('');
      setTwoFactorSetup(null);
    },
  });
  const disableTwoFactorMutation = useMutation({
    mutationFn: (payload: { password: string; code: string }) => authApi.disableTwoFactor(payload),
    onSuccess: () => {
      setIs2faEnabled(false);
      setTwoFactorCode('');
      setTwoFactorDisablePassword('');
      setShowDisable2faPassword(false);
      setTwoFactorSetup(null);
    },
  });

  const normalizeAuthenticatorCode = (raw: string): string => raw.replace(/\D/g, '').slice(0, 6);

  useEffect(() => {
    if (!isOpen) {
      setTwoFactorSetup(null);
      setTwoFactorCode('');
      setTwoFactorDisablePassword('');
      setShowDisable2faPassword(false);
      setupTwoFactorMutation.reset();
      enableTwoFactorMutation.reset();
      disableTwoFactorMutation.reset();
    }
  }, [isOpen]);

  useEffect(() => {
    const enabledFromProfile = Boolean(
      user && (
        (user as { is2faEnabled?: boolean }).is2faEnabled ||
        (user as { isTwoFactorEnabled?: boolean }).isTwoFactorEnabled ||
        (user as { twoFactorEnabled?: boolean }).twoFactorEnabled
      )
    );
    setIs2faEnabled(enabledFromProfile);
  }, [user]);

  const settingSections = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'password', label: 'Change Password', icon: '🔐' },
    { id: '2fa', label: 'Enable 2FA', icon: '🛡️' },
    { id: 'devices', label: 'Devices', icon: '📱' },
    { id: 'theme', label: 'Theme', icon: theme === 'dark' ? '🌙' : '☀️' },
  ];

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const showInfoToast = (message: string) => {
    dispatch(addToast({
      message,
      type: 'info',
      duration: 4000,
    }));
  };

  const handleStartProfileEdit = () => {
    setProfileForm({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
    });
    setIsEditingProfile(true);
  };

  const handleProfileInputChange = (field: 'name' | 'phoneNumber', value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = () => {
    if (!isAdmin) {
      showInfoToast('Profile update is currently available on admin side only.');
      return;
    }

    const payload: { name?: string; phoneNumber?: string } = {};
    if (profileForm.name.trim()) {
      payload.name = profileForm.name.trim();
    }
    if (profileForm.phoneNumber.trim()) {
      payload.phoneNumber = profileForm.phoneNumber.trim();
    }

    adminUpdateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setIsEditingProfile(false);
      },
    });
  };

  const handlePasswordInputChange = (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    value: string
  ) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = () => {
    if (!isAdmin) {
      showInfoToast('Password change is currently available on admin side only.');
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      dispatch(addToast({
        message: 'All password fields are required.',
        type: 'warning',
        duration: 4000,
      }));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      dispatch(addToast({
        message: 'New password and confirm password do not match.',
        type: 'warning',
        duration: 4000,
      }));
      return;
    }

    adminChangePasswordMutation.mutate(
      {
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      },
      {
        onSuccess: () => {
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
      }
    );
  };

  const togglePasswordVisibility = (field: 'currentPassword' | 'newPassword' | 'confirmPassword') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleLogoutThisDevice = () => {
    if (!isAdmin) {
      showInfoToast('Logout action for this section is currently configured for admin side.');
      return;
    }
    adminLogoutMutation.mutate();
  };

  const handleLogoutAllDevices = () => {
    if (!isAdmin) {
      showInfoToast('Logout all devices is currently configured for admin side.');
      return;
    }
    adminLogoutAllMutation.mutate();
  };

  const handleStartTwoFactorSetup = () => {
    if (!isAdmin) {
      showInfoToast('Two-factor authentication is only available in the admin panel.');
      return;
    }
    setupTwoFactorMutation.mutate();
  };

  const handleEnableTwoFactor = () => {
    const code = normalizeAuthenticatorCode(twoFactorCode);
    if (!/^\d{6}$/.test(code)) {
      dispatch(addToast({
        message: 'Enter a 6-digit authenticator code.',
        type: 'warning',
        duration: 4000,
      }));
      return;
    }
    enableTwoFactorMutation.mutate(code);
  };

  const handleDisableTwoFactor = () => {
    const code = normalizeAuthenticatorCode(twoFactorCode);
    if (!twoFactorDisablePassword.trim()) {
      dispatch(addToast({
        message: 'Account password is required.',
        type: 'warning',
        duration: 4000,
      }));
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      dispatch(addToast({
        message: 'Enter a 6-digit authenticator code.',
        type: 'warning',
        duration: 4000,
      }));
      return;
    }
    disableTwoFactorMutation.mutate({
      password: twoFactorDisablePassword.trim(),
      code,
    });
  };

  const handleTwoFactorToggleClick = () => {
    if (is2faEnabled) {
      showInfoToast('Use the disable form below.');
      return;
    }
    if (twoFactorSetup || setupTwoFactorMutation.isPending) {
      setTwoFactorSetup(null);
      setTwoFactorCode('');
      setupTwoFactorMutation.reset();
      return;
    }
    handleStartTwoFactorSetup();
  };

  const renderSectionContent = () => {
    if (activeSection === 'profile') {
      return (
        <div className="settings-panel">
          <h4 className="settings-panel-title">Profile</h4>
          <div className="settings-row">
            <span className="settings-row-label">Name</span>
            <span className="settings-row-value">{user?.name || 'Not available'}</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Phone</span>
            <span className="settings-row-value">{user?.phoneNumber || 'Not available'}</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Email</span>
            <span className="settings-row-value settings-row-value-readonly">
              {user?.email || 'Not available'}
              <span className="settings-readonly-chip">Disabled</span>
            </span>
          </div>
          {isEditingProfile && (
            <div className="settings-form-grid">
              <input
                type="text"
                className="settings-input"
                placeholder="Name"
                value={profileForm.name}
                onChange={(e) => handleProfileInputChange('name', e.target.value)}
                disabled={adminUpdateProfileMutation.isPending}
              />
              <input
                type="text"
                className="settings-input"
                placeholder="Phone number"
                value={profileForm.phoneNumber}
                onChange={(e) => handleProfileInputChange('phoneNumber', e.target.value)}
                disabled={adminUpdateProfileMutation.isPending}
              />
            </div>
          )}
          <div className="settings-actions-grid">
            {!isEditingProfile ? (
              <button
                type="button"
                className="settings-primary-btn"
                onClick={handleStartProfileEdit}
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="settings-secondary-btn"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={adminUpdateProfileMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="settings-primary-btn"
                  onClick={handleSaveProfile}
                  disabled={adminUpdateProfileMutation.isPending}
                >
                  Save Profile
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    if (activeSection === 'password') {
      return (
        <div className="settings-panel">
          <h4 className="settings-panel-title">Change Password</h4>
          <input
            type="text"
            name="fake-username"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            className="settings-input"
            style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
          />
          <input
            type="password"
            name="fake-password"
            autoComplete="new-password"
            tabIndex={-1}
            aria-hidden="true"
            className="settings-input"
            style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
          />
          <div className="settings-form-grid">
            <div className="settings-password-field">
              <input
                type={showPasswords.currentPassword ? 'text' : 'password'}
                placeholder="Current password"
                className="settings-input settings-input-password"
                name="admin-current-password-input"
                autoComplete="new-password"
                data-lpignore="true"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                readOnly
                onFocus={(e) => {
                  e.currentTarget.readOnly = false;
                }}
                disabled={adminChangePasswordMutation.isPending}
              />
              <button
                type="button"
                className="settings-password-toggle"
                onClick={() => togglePasswordVisibility('currentPassword')}
                aria-label={showPasswords.currentPassword ? 'Hide current password' : 'Show current password'}
                disabled={adminChangePasswordMutation.isPending}
              >
                {showPasswords.currentPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="settings-password-field">
              <input
                type={showPasswords.newPassword ? 'text' : 'password'}
                placeholder="New password"
                className="settings-input settings-input-password"
                name="admin-new-password-input"
                autoComplete="new-password"
                data-lpignore="true"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                readOnly
                onFocus={(e) => {
                  e.currentTarget.readOnly = false;
                }}
                disabled={adminChangePasswordMutation.isPending}
              />
              <button
                type="button"
                className="settings-password-toggle"
                onClick={() => togglePasswordVisibility('newPassword')}
                aria-label={showPasswords.newPassword ? 'Hide new password' : 'Show new password'}
                disabled={adminChangePasswordMutation.isPending}
              >
                {showPasswords.newPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="settings-password-field">
              <input
                type={showPasswords.confirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                className="settings-input settings-input-password"
                name="admin-confirm-password-input"
                autoComplete="new-password"
                data-lpignore="true"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                readOnly
                onFocus={(e) => {
                  e.currentTarget.readOnly = false;
                }}
                disabled={adminChangePasswordMutation.isPending}
              />
              <button
                type="button"
                className="settings-password-toggle"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                aria-label={showPasswords.confirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                disabled={adminChangePasswordMutation.isPending}
              >
                {showPasswords.confirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="settings-primary-btn"
            onClick={handleChangePassword}
            disabled={adminChangePasswordMutation.isPending}
          >
            Update Password
          </button>
        </div>
      );
    }

    if (activeSection === '2fa') {
      const qrCodeSource = twoFactorSetup?.qrCodeDataUrl || twoFactorSetup?.qrCodeUrl;
      const isTwoFactorBusy = setupTwoFactorMutation.isPending || enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending;
      const is2faSetupFlow =
        Boolean(qrCodeSource) ||
        setupTwoFactorMutation.isPending ||
        enableTwoFactorMutation.isPending;
      const twoFactorStatusLabel = is2faEnabled ? 'Enabled' : is2faSetupFlow ? 'Pending' : 'Disabled';
      const twoFactorBadgeClass = is2faEnabled ? 'enabled' : is2faSetupFlow ? 'pending' : 'disabled';
      const twoFactorToggleOn = is2faEnabled || is2faSetupFlow;
      return (
        <div className="settings-panel">
          <h4 className="settings-panel-title">Two-Factor Authentication</h4>
          <div className="settings-option">
            <div className="settings-option-label">
              <div className="settings-option-text">
                <div className="settings-option-title">2FA Protection</div>
                <div className="settings-option-description">
                  <span className={`settings-2fa-status-badge ${twoFactorBadgeClass}`}>
                    {twoFactorStatusLabel}
                  </span>
                </div>
              </div>
            </div>
            <button
              className={`theme-toggle ${twoFactorToggleOn ? 'dark' : 'light'}`}
              onClick={handleTwoFactorToggleClick}
              aria-label="Toggle 2FA"
              type="button"
              disabled={isTwoFactorBusy}
            >
              <div className="theme-toggle-slider"></div>
            </button>
          </div>
          {qrCodeSource && (
            <div className="settings-2fa-setup">
              <div className="settings-2fa-qr-card">
                <img src={qrCodeSource} alt="2FA QR Code" className="settings-2fa-qr" />
                {(twoFactorSetup?.manualEntryKey || twoFactorSetup?.secret) && (
                  <div className="settings-2fa-secret">
                    <span className="settings-2fa-secret-label">Secret Key</span>
                    <span className="settings-2fa-secret-value">{twoFactorSetup?.manualEntryKey || twoFactorSetup?.secret}</span>
                  </div>
                )}
              </div>
              <div className="settings-2fa-form-card">
                <div className="settings-2fa-form-title">Verify code</div>
                <input
                  type="text"
                  className="settings-input settings-2fa-otp-input"
                  placeholder="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(normalizeAuthenticatorCode(e.target.value))}
                  disabled={isTwoFactorBusy}
                />
                <button
                  type="button"
                  className="settings-primary-btn"
                  onClick={handleEnableTwoFactor}
                  disabled={isTwoFactorBusy}
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          )}
          {is2faEnabled && (
            <div className="settings-2fa-disable">
              <div className="settings-2fa-form-title">Disable 2FA</div>
              <div className="settings-password-field">
                <input
                  type={showDisable2faPassword ? 'text' : 'password'}
                  className="settings-input settings-input-password"
                  placeholder="Account password"
                  name="settings-2fa-disable-password"
                  autoComplete="current-password"
                  data-lpignore="true"
                  value={twoFactorDisablePassword}
                  onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
                  disabled={isTwoFactorBusy}
                />
                <button
                  type="button"
                  className="settings-password-toggle"
                  onClick={() => setShowDisable2faPassword((prev) => !prev)}
                  aria-label={showDisable2faPassword ? 'Hide password' : 'Show password'}
                  disabled={isTwoFactorBusy}
                >
                  {showDisable2faPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <input
                type="text"
                className="settings-input settings-2fa-otp-input"
                placeholder="6-digit authenticator code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(normalizeAuthenticatorCode(e.target.value))}
                disabled={isTwoFactorBusy}
              />
              <button
                type="button"
                className="settings-danger-btn"
                onClick={handleDisableTwoFactor}
                disabled={isTwoFactorBusy}
              >
                Disable 2FA
              </button>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'devices') {
      const devices = adminDevicesQuery.data?.devices ?? [];
      const pagination = adminDevicesQuery.data?.pagination;

      return (
        <div className="settings-panel">
          <h4 className="settings-panel-title">Device Management</h4>
          <p className="settings-helper-text">
            Manage logout options and track login history by device.
          </p>
          <div className="settings-actions-grid">
            <button
              type="button"
              className="settings-danger-btn"
              onClick={handleLogoutAllDevices}
              disabled={adminLogoutMutation.isPending || adminLogoutAllMutation.isPending}
            >
              Logout All Devices
            </button>
          </div>
          <div className="settings-devices-total">
            Total Devices: {pagination?.total ?? devices.length}
          </div>
          <div className="settings-history-list">
            {!adminDevicesQuery.isLoading && devices.length === 0 && (
              <div className="settings-history-empty">No devices found.</div>
            )}
            {!adminDevicesQuery.isLoading && devices.map((device) => (
              <div
                className={`settings-history-item ${device.isCurrentDevice ? 'current-device' : ''}`}
                key={device.id}
              >
                <div className="settings-history-action">
                  <div>{device.deviceName}</div>
                  {([device.browser, device.platform, device.ipAddress].filter(Boolean).length > 0) && (
                    <div className="settings-device-meta">
                      {[device.browser, device.platform, device.ipAddress].filter(Boolean).join(' | ')}
                    </div>
                  )}
                  {((device.location || device.isCurrentDevice)) && (
                    <div className="settings-device-meta">
                      {device.location}
                      {device.location && device.isCurrentDevice ? ' | ' : ''}
                      {device.isCurrentDevice ? 'Current Device' : ''}
                    </div>
                  )}
                  {device.isCurrentDevice && (
                    <button
                      type="button"
                      className="settings-current-device-logout-btn"
                      onClick={handleLogoutThisDevice}
                      disabled={adminLogoutMutation.isPending || adminLogoutAllMutation.isPending}
                    >
                      Logout This Device
                    </button>
                  )}
                </div>
                {device.lastActiveAt && (
                  <div className="settings-history-time">
                    {new Date(device.lastActiveAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
          {pagination && (
            <div className="settings-pagination">
              <button
                type="button"
                className="settings-secondary-btn"
                onClick={() => setDevicesPage((prev) => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrevPage || adminDevicesQuery.isFetching}
              >
                Prev
              </button>
              <div className="settings-pagination-info">
                Page {pagination.page} of {pagination.totalPages} | Total {pagination.total}
              </div>
              <button
                type="button"
                className="settings-secondary-btn"
                onClick={() => setDevicesPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage || adminDevicesQuery.isFetching}
              >
                Next
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="settings-panel">
        <h4 className="settings-panel-title">Theme</h4>
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
            type="button"
          >
            <div className="theme-toggle-slider"></div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="modal-extra-large"
      title="Settings"
      showCloseButton={true}
    >
      <div className="settings-modal-content">
        <div className="settings-nav">
          {settingSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="settings-nav-icon">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </div>
        <div className="settings-content">{renderSectionContent()}</div>
      </div>
    </Modal>
  );
};

export default SettingsModal;

