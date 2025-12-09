import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { useForgotPasswordLogic } from './ForgotPassword.logic';
import { USER_ROUTES } from '@utils/constants';
import './ForgotPassword.scss';

const UserForgotPassword: React.FC = () => {
  const {
    formData,
    loading,
    success,
    handleInputChange,
    handleSubmit,
  } = useForgotPasswordLogic();

  const leftSideRef = useRef<HTMLDivElement>(null);
  const rightSideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Same animations as login page
    if (leftSideRef.current) {
      const leftElements = leftSideRef.current.querySelectorAll('.gaming-element');
      animate(leftElements, {
        translateY: [{ value: -30, duration: 2000 }, { value: 0, duration: 2000 }],
        translateX: [{ value: -20, duration: 2500 }, { value: 0, duration: 2500 }],
        opacity: [{ value: 0.3, duration: 2000 }, { value: 1, duration: 2000 }],
        scale: [{ value: 0.8, duration: 2500 }, { value: 1.1, duration: 2500 }, { value: 0.8, duration: 2500 }],
        ease: 'easeInOutSine',
        loop: true,
        delay: stagger(200)
      });
    }

    if (rightSideRef.current) {
      const rightElements = rightSideRef.current.querySelectorAll('.gaming-element');
      animate(rightElements, {
        translateY: [{ value: -30, duration: 2000 }, { value: 0, duration: 2000 }],
        translateX: [{ value: 20, duration: 2500 }, { value: 0, duration: 2500 }],
        opacity: [{ value: 0.3, duration: 2000 }, { value: 1, duration: 2000 }],
        scale: [{ value: 0.8, duration: 2500 }, { value: 1.1, duration: 2500 }, { value: 0.8, duration: 2500 }],
        ease: 'easeInOutSine',
        loop: true,
        delay: stagger(200)
      });
    }
  }, []);

  return (
    <div className="forgot-password-container">
      <div className="gaming-side gaming-side-left" ref={leftSideRef}>
        <div className="gaming-orb gaming-orb-1"></div>
        <div className="gaming-orb gaming-orb-2"></div>
        <div className="gaming-element gaming-hexagon gaming-hexagon-1"></div>
        <div className="gaming-element gaming-triangle gaming-triangle-1"></div>
        <div className="gaming-element gaming-circle gaming-circle-1"></div>
      </div>

      <div className="forgot-password-card">
        <h1 className="forgot-password-title">Forgot Password</h1>
        <p className="forgot-password-subtitle">
          {success 
            ? 'Check your email for password reset instructions'
            : 'Enter your email address and we\'ll send you a link to reset your password'}
        </p>

        {!success ? (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="forgot-password-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p>We've sent a password reset link to your email address.</p>
          </div>
        )}

        {/* Links */}
        <div className="auth-links">
          <Link to={USER_ROUTES.LOGIN} className="auth-link">
            Back to Sign In
          </Link>
        </div>
      </div>

      <div className="gaming-side gaming-side-right" ref={rightSideRef}>
        <div className="gaming-orb gaming-orb-3"></div>
        <div className="gaming-orb gaming-orb-4"></div>
        <div className="gaming-element gaming-hexagon gaming-hexagon-2"></div>
        <div className="gaming-element gaming-triangle gaming-triangle-2"></div>
        <div className="gaming-element gaming-circle gaming-circle-2"></div>
      </div>
    </div>
  );
};

export default UserForgotPassword;

