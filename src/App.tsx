import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthMockProvider } from './context/AuthMockContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import Layout from './layout/Layout';
import { getMissingEnvVars, logEnvDebugStatus } from './lib/env';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import CommunityPage from './pages/CommunityPage';
import ContactPage from './pages/ContactPage';
import CoursesPage from './pages/CoursesPage';
import HomePage from './pages/HomePage';
import MISPage from './pages/MISPage';
import MultiplayerEventPage from './pages/MultiplayerEventPage';
import MultiplayerPage from './pages/MultiplayerPage';
import MultiplayerRunDetailPage from './pages/MultiplayerRunDetailPage';
import PathwayDetailPage from './pages/PathwayDetailPage';
import PathwaysPage from './pages/PathwaysPage';
import PricingPage from './pages/PricingPage';
import ProductsPage from './pages/ProductsPage';
import SimulationsPage from './pages/SimulationsPage';

function EnvErrorBanner() {
  const missingVars = getMissingEnvVars();

  if (!missingVars.length) {
    return null;
  }

  return (
    <div className="container-wide py-4">
      <div className="rounded-xl border border-amber-300/30 bg-amber-900/20 p-4 text-sm text-amber-100">
        <p className="font-semibold">Environment configuration warning</p>
        <p className="mt-1">Missing env vars: {missingVars.join(', ')}.</p>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    logEnvDebugStatus();
  }, []);

  return (
    <SupabaseAuthProvider>
      <AuthMockProvider>
        <Layout>
          <EnvErrorBanner />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/simulations" element={<SimulationsPage />} />
            <Route path="/products/courses" element={<CoursesPage />} />
            <Route path="/products/community" element={<CommunityPage />} />
            <Route path="/products/mis" element={<MISPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/pathways" element={<PathwaysPage />} />
            <Route path="/pathways/:id" element={<PathwayDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/multiplayer" element={<MultiplayerPage />} />
            <Route
              path="/admin"
              element={(
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/multiplayer/runs/:runId"
              element={(
                <ProtectedRoute>
                  <MultiplayerRunDetailPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/multiplayer/events/:eventCode"
              element={(
                <ProtectedRoute>
                  <MultiplayerEventPage />
                </ProtectedRoute>
              )}
            />
            <Route path="/login" element={<AuthPage type="login" />} />
            <Route path="/signup" element={<AuthPage type="signup" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthMockProvider>
    </SupabaseAuthProvider>
  );
}
