import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const LeadersPage = lazy(() => import('./pages/LeadersPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const Login = lazy(() => import('./pages/Login'));
const CoordinatorPortal = lazy(() => import('./pages/CoordinatorPortal'));
const ApproverWorkspace = lazy(() => import('./pages/ApproverWorkspace'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));

import GlobalShortcuts from './components/GlobalShortcuts';
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
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading application...</div>}>
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
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalShortcuts />
        <AppRoutes />
        <InstallPWA />
      </BrowserRouter>
    </AuthProvider>
  );
}
