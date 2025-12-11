import { useLocation } from 'react-router-dom';
import { ROUTES, USER_ROUTES, STATIC_ROUTES, isAdminDomain } from '@utils/constants';
import Footer from './Footer';
import './Layout.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdmin = isAdminDomain();
  
  // Don't show footer on login/register pages and static pages
  const hideFooterPaths: string[] = isAdmin 
    ? [ROUTES.LOGIN]
    : [USER_ROUTES.LOGIN, USER_ROUTES.REGISTER, USER_ROUTES.FORGOT_PASSWORD];
  
  const staticPagePaths: string[] = Object.values(STATIC_ROUTES) as string[];
  const shouldHideFooter = hideFooterPaths.includes(location.pathname) || 
                          staticPagePaths.includes(location.pathname);

  // Check if current page has sidebar (authenticated pages)
  const hasSidebar = !hideFooterPaths.includes(location.pathname) && 
                     !staticPagePaths.includes(location.pathname);

  return (
    <>
      <div className="app-content">
        {children}
      </div>
      {!shouldHideFooter && (
        <div className={`app-footer-wrapper ${hasSidebar ? 'has-sidebar' : ''}`}>
          <Footer />
        </div>
      )}
    </>
  );
};

export default Layout;
