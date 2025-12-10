import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { useRegisterLogic } from './Register.logic';
import { USER_ROUTES } from '@utils/constants';
import './Register.scss';

const UserRegister: React.FC = () => {
  const {
    formData,
    loading,
    googleLoading,
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    handleInputChange,
    handleSubmit,
    handleGoogleLogin,
  } = useRegisterLogic();

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
    <div className="register-container">
      <div className="gaming-side gaming-side-left" ref={leftSideRef}>
        <div className="gaming-orb gaming-orb-1"></div>
        <div className="gaming-orb gaming-orb-2"></div>
        <div className="gaming-element gaming-hexagon gaming-hexagon-1"></div>
        <div className="gaming-element gaming-triangle gaming-triangle-1"></div>
        <div className="gaming-element gaming-circle gaming-circle-1"></div>
      </div>

      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <p className="register-subtitle">Join GamingHub and start playing</p>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

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

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input password-input"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={togglePasswordVisibility}
                disabled={loading}
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
              Confirm Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword || ''}
                onChange={handleInputChange}
                className="form-input password-input"
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={toggleConfirmPasswordVisibility}
                disabled={loading}
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

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Links */}
        <div className="auth-links">
          <span className="auth-link-text">Already have an account?</span>
          <Link to={USER_ROUTES.LOGIN} className="auth-link">
            Sign In
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

export default UserRegister;

