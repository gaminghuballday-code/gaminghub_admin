import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@components/common/ProtectedRoute';
import Loading from '@components/common/Loading';
import GlobalLoader from '@components/common/GlobalLoader';
import Toaster from '@components/common/Toaster';
import { USER_ROUTES } from '@utils/constants';

// Code splitting with lazy loading for user components
const UserLogin = lazy(() => import('@components/user/Auth/Login/Login'));
const UserRegister = lazy(() => import('@components/user/Auth/Register/Register'));
const UserForgotPassword = lazy(() => import('@components/user/Auth/ForgotPassword/ForgotPassword'));
const UserHome = lazy(() => import('@components/user/Home/Home'));
const UserProfile = lazy(() => import('@components/user/Profile/Profile'));
const UserTournaments = lazy(() => import('@components/user/Tournaments/Tournaments'));
const UserLobby = lazy(() => import('@components/user/Lobby/Lobby'));
const UserHistory = lazy(() => import('@components/user/History/History'));
const UserWallet = lazy(() => import('@components/user/Wallet/Wallet'));

function UserApp() {
  return (
    <BrowserRouter>
      <GlobalLoader />
      <Toaster />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path={USER_ROUTES.LOGIN} element={<UserLogin />} />
          <Route path={USER_ROUTES.REGISTER} element={<UserRegister />} />
          <Route path={USER_ROUTES.FORGOT_PASSWORD} element={<UserForgotPassword />} />
          <Route
            path={USER_ROUTES.HOME}
            element={
              <ProtectedRoute>
                <UserHome />
              </ProtectedRoute>
            }
          />
          <Route
            path={USER_ROUTES.PROFILE}
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path={USER_ROUTES.TOURNAMENTS}
            element={
              <ProtectedRoute>
                <UserTournaments />
              </ProtectedRoute>
            }
          />
          <Route
            path={USER_ROUTES.LOBBY}
            element={
              <ProtectedRoute>
                <UserLobby />
              </ProtectedRoute>
            }
          />
          <Route
            path={USER_ROUTES.HISTORY}
            element={
              <ProtectedRoute>
                <UserHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path={USER_ROUTES.WALLET}
            element={
              <ProtectedRoute>
                <UserWallet />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={USER_ROUTES.HOME} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default UserApp;

