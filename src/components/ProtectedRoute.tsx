import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useSupabaseAuth();
  const location = useLocation();

  if (loading) {
    return <section className="container-wide py-20 text-sm text-slate-300">Loading account…</section>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
