import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';

const SearchPage = lazy(() => import('./pages/SearchPage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const FavouritesPage = lazy(() => import('./pages/FavouritesPage'));
const OwnerDashboardPage = lazy(() => import('./pages/OwnerDashboardPage'));
const PropertyFormPage = lazy(() => import('./pages/PropertyFormPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-3 border-[#2563EB] border-t-transparent animate-spin" />
    </div>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<RouteFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWrapper>
                <HomePage />
              </PageWrapper>
            }
          />
          <Route
            path="/rooms"
            element={
              <PageWrapper>
                <SearchPage />
              </PageWrapper>
            }
          />
          <Route
            path="/rooms/:slug"
            element={
              <PageWrapper>
                <PropertyDetailPage />
              </PageWrapper>
            }
          />
          <Route
            path="/about"
            element={
              <PageWrapper>
                <AboutPage />
              </PageWrapper>
            }
          />
          <Route
            path="/login"
            element={
              <PageWrapper>
                <LoginPage />
              </PageWrapper>
            }
          />
          <Route
            path="/register"
            element={
              <PageWrapper>
                <RegisterPage />
              </PageWrapper>
            }
          />
          <Route
            path="/favourites"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <FavouritesPage />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <OwnerDashboardPage />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/add-property"
            element={
              <ProtectedRoute allowedRoles={['owner', 'admin']}>
                <PageWrapper>
                  <PropertyFormPage />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/edit-property/:id"
            element={
              <ProtectedRoute allowedRoles={['owner', 'admin']}>
                <PageWrapper>
                  <PropertyFormPage />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PageWrapper>
                  <AdminDashboardPage />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <PageWrapper>
                <HomePage />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col bg-white text-[#0F172A]">
              <Navbar />
              <main className="flex-1">
                <AnimatedRoutes />
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
