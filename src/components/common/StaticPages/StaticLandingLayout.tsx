import { Link } from 'react-router-dom';
import BackButton from '@components/common/BackButton';
import { STATIC_ROUTES } from '@utils/constants';
import './StaticLanding.scss';

interface StaticLandingLayoutProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
}

const StaticLandingLayout: React.FC<StaticLandingLayoutProps> = ({
  title,
  children,
  showBackButton = true,
}) => (
  <div className="static-landing">
    <nav className="sl-nav">
      <Link to={STATIC_ROUTES.DOWNLOADS} className="sl-logo">
        BOOYAH<em>X</em>
      </Link>
      <div className="sl-nav-links">
        <Link to={STATIC_ROUTES.DOWNLOADS} className="sl-nl">Download</Link>
        <Link to={STATIC_ROUTES.TERMS_CONDITIONS} className="sl-nl">Terms</Link>
        <Link to={STATIC_ROUTES.PRIVACY} className="sl-nl">Privacy</Link>
        <Link to={STATIC_ROUTES.CONTACT_US} className="sl-nav-btn">Contact</Link>
      </div>
    </nav>

    <div className="sl-strip">
      {showBackButton && <BackButton className="sl-back" />}
      <h1 className="sl-page-title">{title}</h1>
    </div>

    <main className="sl-main">
      <div className="sl-content">{children}</div>
    </main>

    <footer className="sl-footer">
      <Link to={STATIC_ROUTES.DOWNLOADS} className="sl-foot-logo">
        BOOYAH<em>X</em>
      </Link>
      <div className="sl-foot-links">
        <Link to={STATIC_ROUTES.PRIVACY}>Privacy Policy</Link>
        <Link to={STATIC_ROUTES.TERMS_CONDITIONS}>Terms of Use</Link>
        <Link to={STATIC_ROUTES.CONTACT_US}>Contact</Link>
        <Link to={STATIC_ROUTES.CONTACT_US}>Support</Link>
      </div>
      <p>© 2025 BooyahX. All rights reserved. &nbsp;·&nbsp; Designed for Indian Free Fire players.</p>
    </footer>
  </div>
);

export default StaticLandingLayout;
