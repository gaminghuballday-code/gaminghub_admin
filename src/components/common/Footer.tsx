import { Link } from 'react-router-dom';
import { STATIC_ROUTES } from '@utils/constants';
import './Footer.scss';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">Legal</h3>
          <div className="footer-links">
            <Link to={STATIC_ROUTES.TERMS_CONDITIONS} className="footer-link">
              Terms & Conditions
            </Link>
            <Link to={STATIC_ROUTES.PRIVACY} className="footer-link">
              Privacy Policy
            </Link>
            <Link to={STATIC_ROUTES.CANCELLATION_REFUNDS} className="footer-link">
              Cancellation & Refunds
            </Link>
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Support</h3>
          <div className="footer-links">
            <Link to={STATIC_ROUTES.CONTACT_US} className="footer-link">
              Contact Us
            </Link>
            <Link to={STATIC_ROUTES.SHIPPING} className="footer-link">
              Shipping Policy
            </Link>
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">About</h3>
          <p className="footer-text">
            Booyahx - Your ultimate gaming tournament platform
          </p>
          <p className="footer-copyright">
            © {new Date().getFullYear()} Booyahx. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
