import { useState } from 'react';
import { useUserProfile, useUpdateProfile } from '@services/api/hooks/useUserAuthQueries';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Modal from '@components/common/Modal/Modal';
import Loading from '@components/common/Loading';
import { Button } from '@components/common/Button';
import { useSidebarSync } from '@hooks/useSidebarSync';
import './Profile.scss';

const UserProfile: React.FC = () => {
  const { data: profile, isLoading, error } = useUserProfile(true);
  const updateProfileMutation = useUpdateProfile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    ign: '',
    paymentMethod: '',
    phoneNumber: '',
    paymentUPI: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenUpdateModal = () => {
    setFormData({
      name: profile?.name || '',
      age: profile?.age?.toString() || '',
      gender: profile?.gender || '',
      ign: profile?.ign || '',
      paymentMethod: profile?.paymentMethod || '',
      phoneNumber: profile?.phoneNumber || '',
      paymentUPI: profile?.paymentUPI || '',
    });
    setFormError(null);
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setFormData({
      name: '',
      age: '',
      gender: '',
      ign: '',
      paymentMethod: '',
      phoneNumber: '',
      paymentUPI: '',
    });
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formError) setFormError(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Prepare update data
    const updateData: {
      name?: string;
      age?: number;
      gender?: string;
      ign?: string;
      paymentMethod?: string;
      phoneNumber?: string;
      paymentUPI?: string;
    } = {};

    if (formData.name.trim()) {
      updateData.name = formData.name.trim();
    }
    if (formData.age.trim()) {
      const ageNum = parseInt(formData.age.trim(), 10);
      if (!isNaN(ageNum) && ageNum > 0) {
        updateData.age = ageNum;
      }
    }
    if (formData.gender.trim()) {
      updateData.gender = formData.gender.trim();
    }
    if (formData.ign.trim()) {
      updateData.ign = formData.ign.trim();
    }
    if (formData.paymentMethod.trim()) {
      updateData.paymentMethod = formData.paymentMethod.trim();
    }
    if (formData.phoneNumber.trim()) {
      updateData.phoneNumber = formData.phoneNumber.trim();
    }
    if (formData.paymentUPI.trim()) {
      updateData.paymentUPI = formData.paymentUPI.trim();
    }

    updateProfileMutation.mutate(updateData, {
      onSuccess: () => {
        handleCloseUpdateModal();
      },
      onError: () => {
        // Error will be handled by API interceptor
      },
    });
  };

  return (
    <div className="user-profile-container">
      <UserSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="user-main">
        <header className="user-header">
          <h1>Profile</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          {isLoading ? (
            <div className="profile-loading">
              <Loading />
            </div>
          ) : error ? (
            <div className="profile-error">
              <div className="error-icon">⚠️</div>
              <h3>Failed to load profile</h3>
              <p>Please try refreshing the page.</p>
            </div>
          ) : (
            <div className="profile-card">
              <div className="profile-header">
                <h2 className="card-title">User Profile</h2>
                <Button
                  variant="primary"
                  onClick={handleOpenUpdateModal}
                  disabled={updateProfileMutation.isPending}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  }
                >
                  Update Profile
                </Button>
              </div>

              {profile ? (
                <div className="profile-details">
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">Name:</span>
                      <span className="profile-value">{profile.name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">Email:</span>
                      <span className="profile-value">{profile.email}</span>
                    </div>
                  </div>
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">Role:</span>
                      <span className="profile-value role-badge">{profile.role || 'User'}</span>
                    </div>
                  </div>
                  {profile.isEmailVerified !== undefined && (
                    <div className="profile-item">
                      <div className="profile-item-content">
                        <span className="profile-label">Email Verified:</span>
                        <span className={`profile-value ${profile.isEmailVerified ? 'verified' : 'not-verified'}`}>
                          {profile.isEmailVerified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">Age:</span>
                      <span className="profile-value">{profile.age || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">Gender:</span>
                      <span className="profile-value">{profile.gender || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">IGN (In-Game Name):</span>
                      <span className="profile-value">{profile.ign || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">Phone Number:</span>
                      <span className="profile-value">{profile.phoneNumber || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">Payment Method:</span>
                      <span className="profile-value">{profile.paymentMethod || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="profile-item">
                    <div className="profile-item-content">
                      <span className="profile-label">Payment UPI:</span>
                      <span className="profile-value">{profile.paymentUPI || 'Not set'}</span>
                    </div>
                  </div>
                  {profile.createdAt && (
                    <div className="profile-item">
                      <div className="profile-item-content">
                        <span className="profile-label">Member Since:</span>
                        <span className="profile-value">
                          {new Date(profile.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="no-data">No user data available</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Update Profile Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={handleCloseUpdateModal}
        title="Update Profile"
        showCloseButton={true}
        className="update-profile-modal"
      >
        <form onSubmit={handleUpdateSubmit} className="update-profile-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your name"
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="age" className="form-label">
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your age"
              min="1"
              max="120"
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender" className="form-label">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="form-input"
              disabled={updateProfileMutation.isPending}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ign" className="form-label">
              IGN (In-Game Name)
            </label>
            <input
              type="text"
              id="ign"
              name="ign"
              value={formData.ign}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your in-game name"
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your phone number"
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod" className="form-label">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="form-input"
              disabled={updateProfileMutation.isPending}
            >
              <option value="">Select payment method</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Wallet">Wallet</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="paymentUPI" className="form-label">
              Payment UPI ID
            </label>
            <input
              type="text"
              id="paymentUPI"
              name="paymentUPI"
              value={formData.paymentUPI}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your UPI ID (e.g., yourname@paytm)"
              disabled={updateProfileMutation.isPending}
            />
          </div>

          {/* Read-only fields */}
          <div className="form-group readonly-group">
            <label className="form-label">Email (Cannot be changed)</label>
            <input
              type="email"
              value={profile?.email || ''}
              className="form-input readonly-input"
              disabled
              readOnly
            />
          </div>

          <div className="form-group readonly-group">
            <label className="form-label">Role (Cannot be changed)</label>
            <input
              type="text"
              value={profile?.role || 'User'}
              className="form-input readonly-input"
              disabled
              readOnly
            />
          </div>

          {formError && (
            <div className="form-error">
              {formError}
            </div>
          )}

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseUpdateModal}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updateProfileMutation.isPending}
              loading={updateProfileMutation.isPending}
            >
              Update Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserProfile;
