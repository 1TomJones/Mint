import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './layout/Layout';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import CommunityPage from './pages/CommunityPage';
import ContactPage from './pages/ContactPage';
import CoursesPage from './pages/CoursesPage';
import HomePage from './pages/HomePage';
import MISPage from './pages/MISPage';
import PricingPage from './pages/PricingPage';
import ProductsPage from './pages/ProductsPage';
import SimulationsPage from './pages/SimulationsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/simulations" element={<SimulationsPage />} />
        <Route path="/products/courses" element={<CoursesPage />} />
        <Route path="/products/community" element={<CommunityPage />} />
        <Route path="/products/mis" element={<MISPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<AuthPage type="login" />} />
        <Route path="/signup" element={<AuthPage type="signup" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
