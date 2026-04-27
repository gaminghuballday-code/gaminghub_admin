import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BackButton from '@components/common/BackButton';
import { STATIC_ROUTES, getPublicAbsoluteUrl } from '@utils/constants';
import { applyManagedPageSeo } from '@utils/seo';
import './StaticLanding.scss';

interface StaticLandingLayoutProps {
  title: string;
  /** Meta description for the page */
  description?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
}

const StaticLandingLayout: React.FC<StaticLandingLayoutProps> = ({
  title,
  description,
  children,
  showBackButton = true,
}) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Generate canonical URL for the current path
    const canonicalUrl = getPublicAbsoluteUrl(pathname);
    
    return applyManagedPageSeo({
      title: `${title} | BooyahX`,
      description: description || 'BooyahX — Free Fire tournaments, real cash prizes, and instant UPI withdrawals. Play and earn daily.',
      canonicalUrl,
    });
  }, [title, description, pathname]);

  return (
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
};

export default StaticLandingLayout;
