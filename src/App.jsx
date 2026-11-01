import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/layouts/AppLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { appRoutes } from '@/routes/routes';
import LoginPage from '@/pages/auth/LoginPage';
import NotFoundPage from '@/pages/system/NotFoundPage';

// The page list lives in routes/routes.jsx. This file only wires it together:
//   AuthProvider -> /login, or the logged-in layout with every page from appRoutes.
const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          ...appRoutes.map(({ path, element, roles }) => ({
            path,
            element: <ProtectedRoute roles={roles}>{element}</ProtectedRoute>,
          })),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
