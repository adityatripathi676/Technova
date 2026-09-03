import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to correct dashboard based on actual role
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'approver') return <Navigate to="/approver" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
