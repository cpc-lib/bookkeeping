import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { authApi } from './api/auth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './pages/MainLayout';
import RecordsPage from './pages/RecordsPage';
import StatsPage from './pages/StatsPage';
import AddRecordPage from './pages/AddRecordPage';
import RecordDetailPage from './pages/RecordDetailPage';
import CategoryPage from './pages/CategoryPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

/** 登录守卫: 无token跳转登录页; 已登录但缺用户信息时拉取 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const location = useLocation();

  useEffect(() => {
    if (token && !user) {
      authApi
        .info()
        .then((u) => {
          if (u) setUser(u);
          else clear();
        })
        .catch(() => {
          /* 401由拦截器统一处理 */
        });
    }
  }, [token, user, setUser, clear]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-cream shadow-xl">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<RecordsPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="categories" element={<CategoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="/record/add"
          element={
            <RequireAuth>
              <AddRecordPage />
            </RequireAuth>
          }
        />
        <Route
          path="/record/:id"
          element={
            <RequireAuth>
              <RecordDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/password"
          element={
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
