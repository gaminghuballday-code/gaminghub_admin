import { useState, useRef, useEffect } from 'react';
import Modal from '@components/common/Modal/Modal';
import { useVerifyOtp } from '@services/api/hooks/useUserAuthQueries';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import './OtpModal.scss';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  password: string;
}

const OtpModal: React.FC<OtpModalProps> = ({ isOpen, onClose, email, password }) => {
  const dispatch = useAppDispatch();
  const verifyOtpMutation = useVerifyOtp();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Focus first input when modal opens
      inputRefs.current[0]?.focus();
      // Reset OTP when modal opens
      setOtp(['', '', '', '', '', '']);
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

    verifyOtpMutation.mutate(
      {
        email,
        otp: otpString,
        password,
      },
      {
        onError: (error: any) => {
          // Error will be handled by API interceptor, but we can add specific handling here
          const errorMessage = error?.response?.data?.message || error?.message || 'OTP verification failed';
          dispatch(addToast({
            message: errorMessage,
            type: 'error',
            duration: 5000,
          }));
          // Reset OTP on error
          setOtp(['', '', '', '', '', '']);
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
      className="otp-modal"
      closeOnOverlayClick={false}
      showCloseButton={true}
      title="Verify OTP"
    >
      <div className="otp-modal-content">
        <p className="otp-modal-message">
          We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter it below to complete your registration.
        </p>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={verifyOtpMutation.isPending}
                autoComplete="off"
              />
            ))}
          </div>

          <button
            type="submit"
            className="otp-submit-button"
            disabled={verifyOtpMutation.isPending || otp.join('').length !== 6}
          >
            {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="otp-resend">
          <span className="otp-resend-text">Didn't receive the OTP?</span>
          <button
            type="button"
            className="otp-resend-button"
            onClick={handleResendOtp}
            disabled={verifyOtpMutation.isPending}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OtpModal;
