import { useState, useRef, useEffect } from 'react';
import Modal from '@components/common/Modal/Modal';
import { useResetPassword } from '@services/api/hooks/useUserAuthQueries';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { useNavigate } from 'react-router-dom';
import { USER_ROUTES } from '@utils/constants';
import './ForgotPasswordOtpModal.scss';

interface ForgotPasswordOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const ForgotPasswordOtpModal: React.FC<ForgotPasswordOtpModalProps> = ({ isOpen, onClose, email }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const resetPasswordMutation = useResetPassword();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Focus first input when modal opens
      inputRefs.current[0]?.focus();
      // Reset OTP and passwords when modal opens
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) {
            newOtp[index + i] = digit;
          }
        });
        setOtp(newOtp);
        // Focus the last filled input or the last input
        const lastFilledIndex = Math.min(index + digits.length - 1, 5);
        inputRefs.current[lastFilledIndex]?.focus();
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      dispatch(addToast({
        message: 'Please enter a valid 6-digit OTP',
        type: 'error',
        duration: 4000,
      }));
      return;
    }

    if (!newPassword.trim()) {
      dispatch(addToast({
        message: 'Please enter a new password',
        type: 'error',
        duration: 4000,
      }));
      return;
    }

    if (newPassword.length < 6) {
      dispatch(addToast({
        message: 'Password must be at least 6 characters',
        type: 'error',
        duration: 4000,
      }));
      return;
    }

    if (newPassword !== confirmPassword) {
      dispatch(addToast({
        message: 'Passwords do not match',
        type: 'error',
        duration: 4000,
      }));
      return;
    }

    resetPasswordMutation.mutate(
      {
        email,
        otp: otpString,
        newPassword,
      },
      {
        onSuccess: () => {
          // Success message will be shown by API interceptor
          // Close modal and navigate to login
          onClose();
          navigate(USER_ROUTES.LOGIN);
        },
        onError: (error: any) => {
          // Error will be handled by API interceptor, but we can add specific handling here
          const errorMessage = error?.response?.data?.message || error?.message || 'Password reset failed';
          dispatch(addToast({
            message: errorMessage,
            type: 'error',
            duration: 5000,
          }));
          // Reset OTP on error
          setOtp(['', '', '', '', '', '']);
          setNewPassword('');
          setConfirmPassword('');
          inputRefs.current[0]?.focus();
        },
      }
    );
  };

  const handleResendOtp = () => {
    // TODO: Implement resend OTP functionality if needed
    dispatch(addToast({
      message: 'Resend OTP functionality not implemented yet',
      type: 'info',
      duration: 3000,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="forgot-password-otp-modal"
      closeOnOverlayClick={false}
      showCloseButton={true}
      title="Reset Password"
    >
      <div className="forgot-password-otp-modal-content">
        <p className="forgot-password-otp-modal-message">
          We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter it below along with your new password.
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-otp-form">
          <div className="otp-section">
            <label className="form-label">Enter OTP</label>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  disabled={resetPasswordMutation.isPending}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          <div className="password-section">
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input password-input"
                  placeholder="Enter new password"
                  required
                  disabled={resetPasswordMutation.isPending}
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={resetPasswordMutation.isPending}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input password-input"
                  placeholder="Confirm new password"
                  required
                  disabled={resetPasswordMutation.isPending}
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={resetPasswordMutation.isPending}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="forgot-password-otp-submit-button"
            disabled={resetPasswordMutation.isPending || otp.join('').length !== 6 || !newPassword.trim() || !confirmPassword.trim()}
          >
            {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="otp-resend">
          <span className="otp-resend-text">Didn't receive the OTP?</span>
          <button
            type="button"
            className="otp-resend-button"
            onClick={handleResendOtp}
            disabled={resetPasswordMutation.isPending}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ForgotPasswordOtpModal;
