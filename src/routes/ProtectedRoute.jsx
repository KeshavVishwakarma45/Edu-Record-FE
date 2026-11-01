import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';
import ForbiddenPage from '@/pages/system/ForbiddenPage';
import { canOpen } from './routes';

// Not logged in -> login page (and come back here afterwards).
// Logged in but the role may not open the page -> "No access" page.
// Hiding a page is only for convenience: the server checks the permission again on every request.
export default function ProtectedRoute({ route, children }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) return <LoadingScreen />;
  if (!auth.user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (route && !canOpen(route, auth)) return <ForbiddenPage />;
  return children;
}
