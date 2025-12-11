import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@components/common/ProtectedRoute';
import Loading from '@components/common/Loading';
import GlobalLoader from '@components/common/GlobalLoader';
import Toaster from '@components/common/Toaster';
import Layout from '@components/common/Layout';
import { ROUTES, STATIC_ROUTES } from '@utils/constants';

// Code splitting with lazy loading
const Login = lazy(() => import('@components/Auth/Login/Login'));
const Dashboard = lazy(() => import('@components/Dashboard/Dashboard'));
const HealthStatus = lazy(() => import('@components/HealthStatus/HealthStatus'));
const Profile = lazy(() => import('@components/Profile/Profile'));
const GenerateLobbyPage = lazy(() => import('@components/GenerateLobbyPage/GenerateLobbyPage'));
const TopUpPage = lazy(() => import('@components/TopUpPage/TopUpPage'));
const HostCreationPage = lazy(() => import('@components/HostCreationPage/HostCreationPage'));
const UserHistoryPage = lazy(() => import('@components/UserHistoryPage/UserHistoryPage'));

// Static pages (public - no authentication required)
const CancellationRefunds = lazy(() => import('@components/common/StaticPages/CancellationRefunds'));
const TermsConditions = lazy(() => import('@components/common/StaticPages/TermsConditions'));
const Shipping = lazy(() => import('@components/common/StaticPages/Shipping'));
const Privacy = lazy(() => import('@components/common/StaticPages/Privacy'));
const ContactUs = lazy(() => import('@components/common/StaticPages/ContactUs'));

function App() {
  return (
    <BrowserRouter>
      <GlobalLoader />
      <Toaster />
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.HEALTH}
            element={
              <ProtectedRoute>
                <HealthStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROFILE}
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.GENERATE_LOBBY}
            element={
              <ProtectedRoute>
                <GenerateLobbyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.TOP_UP}
            element={
              <ProtectedRoute>
                <TopUpPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.HOST_CREATION}
            element={
              <ProtectedRoute>
                <HostCreationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.USER_HISTORY}
            element={
              <ProtectedRoute>
                <UserHistoryPage />
              </ProtectedRoute>
            }
          />
          {/* Static pages - public access */}
          <Route path={STATIC_ROUTES.CANCELLATION_REFUNDS} element={<CancellationRefunds />} />
          <Route path={STATIC_ROUTES.TERMS_CONDITIONS} element={<TermsConditions />} />
          <Route path={STATIC_ROUTES.SHIPPING} element={<Shipping />} />
          <Route path={STATIC_ROUTES.PRIVACY} element={<Privacy />} />
          <Route path={STATIC_ROUTES.CONTACT_US} element={<ContactUs />} />
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
