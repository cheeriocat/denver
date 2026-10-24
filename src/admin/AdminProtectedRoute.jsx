// src/admin/AdminProtectedRoute.jsx
// Wraps admin routes — redirects to /admin/login if:
//   • user is not signed in, OR
//   • user is signed in but not in admins/{uid}

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';

export default function AdminProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  const { isAdmin, adminLoading }    = useIsAdmin();

  if (authLoading || adminLoading) {
    return <div className="page-loading">Verifying access…</div>;
  }

  if (!currentUser || !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ error: !currentUser ? undefined : 'You do not have admin access.' }}
      />
    );
  }

  return children;
}
