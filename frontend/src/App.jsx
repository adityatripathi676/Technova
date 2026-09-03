import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import LeadersPage from './pages/LeadersPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import Login from './pages/Login';
import CoordinatorPortal from './pages/CoordinatorPortal';
import ApproverWorkspace from './pages/ApproverWorkspace';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import './styles/theme.css';
import InstallPWA from './components/InstallPWA';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'approver') return <Navigate to="/approver" replace />;
  return <Navigate to="/portal" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leaders" element={<LeadersPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/track/:eventId" element={<EventDetailsPage />} />
      <Route path="/portal" element={<CoordinatorPortal />} />
      <Route path="/login" element={<Login />} />
      <Route path="/approver" element={
        <ProtectedRoute requiredRole="approver"><ApproverWorkspace /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <InstallPWA />
      </BrowserRouter>
    </AuthProvider>
  );
}
