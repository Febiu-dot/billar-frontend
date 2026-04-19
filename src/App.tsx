import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import VenuesPage from './pages/VenuesPage';
import TablesPage from './pages/TablesPage';
import PlayersPage from './pages/PlayersPage';
import MatchesPage from './pages/MatchesPage';
import JudgePage from './pages/JudgePage';
import PublicPage from './pages/PublicPage';
import FixturePage from './pages/FixturePage';
import Layout from './components/layout/Layout';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><span className="text-gold font-display text-2xl">Cargando...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/publico" element={<PublicPage />} />
      <Route path="/fixture" element={<FixturePage />} />

      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'admin' ? <Navigate to="/admin" replace /> :
           user?.role === 'juez_sede' ? <Navigate to="/juez" replace /> :
           <Navigate to="/publico" replace />}
        </ProtectedRoute>
      } />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="sedes" element={<VenuesPage />} />
        <Route path="mesas" element={<TablesPage />} />
        <Route path="jugadores" element={<PlayersPage />} />
        <Route path="partidos" element={<MatchesPage />} />
        <Route path="fixture" element={<FixturePage />} />
      </Route>

      <Route path="/juez" element={<ProtectedRoute roles={['juez_sede', 'admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<JudgePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
