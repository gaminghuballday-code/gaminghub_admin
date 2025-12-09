import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import './Profile.scss';

const UserProfile: React.FC = () => {
  const user = useAppSelector(selectUser);

  return (
    <div className="user-profile-container">
      <UserSidebar />

      <main className="user-main">
        <header className="user-header">
          <h1>Profile</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="profile-card">
            <h2 className="card-title">User Profile</h2>
            {user ? (
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">Name:</span>
                  <span className="profile-value">{user.name || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email:</span>
                  <span className="profile-value">{user.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Role:</span>
                  <span className="profile-value">{user.role || 'User'}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Balance GC:</span>
                  <span className="profile-value balance-value">{user.balanceGC ?? 0}</span>
                </div>
              </div>
            ) : (
              <p>No user data available</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;

