import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';
import ForbiddenPage from '@/pages/system/ForbiddenPage';

// Not logged in -> login page (and come back here afterwards).
// Logged in but this role may not open the page -> "No access" page.
// Hiding a page is only for convenience: the server checks the role again on every request.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading, currentRole } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(currentRole)) return <ForbiddenPage />;
  return children;
}
