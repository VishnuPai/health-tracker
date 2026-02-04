import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Diet from './pages/Diet';
import Sleep from './pages/Sleep';
import Insights from './pages/Insights';
import ProfilePage from './pages/Profile';
import Labs from './pages/Labs';
import AdminDashboard from './pages/AdminDashboard';
import CoachDashboard from './pages/CoachDashboard';
import AuthPage from './pages/Auth';
import { useHealth } from './context/HealthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useHealth();

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  if (!user) return <Navigate to="/auth" replace />;

  return children;
};

// Route that redirects to Dashboard if already logged in
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useHealth();

  if (loading) return null;

  if (user) return <Navigate to="/" replace />;

  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/auth" element={
        <PublicOnlyRoute>
          <AuthPage />
        </PublicOnlyRoute>
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="diet" element={<Diet />} />
        <Route path="sleep" element={<Sleep />} />
        <Route path="insights" element={<Insights />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="labs" element={<Labs />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="coach" element={<CoachDashboard />} />
      </Route>
    </Routes>
  );
};

export default App;
