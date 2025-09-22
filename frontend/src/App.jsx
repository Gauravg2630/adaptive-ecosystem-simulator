import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SimulationProvider } from "./context/SimulationContext";
import { DashboardProvider } from "./context/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Simulation = lazy(() => import("./pages/Simulation"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Logbook = lazy(() => import("./pages/LogBook"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Alerts = lazy(() => import("./pages/Alerts"));
// ✅ New Day 27 - AI Predictions page
const Predictions = lazy(() => import("./pages/Predictions"));

// ✅ Enhanced Loading Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-green-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        🌿 Ecosystem Simulator
      </h3>
      <p className="text-gray-500 dark:text-gray-400 animate-pulse">
        {message}
      </p>
    </motion.div>
  </div>
);

// ✅ Enhanced ProtectedRoute with better UX
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ✅ Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ✅ Enhanced Page Wrapper with animations
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

// ✅ Suspense Fallback Component
const SuspenseFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading page...</p>
    </div>
  </div>
);

// ✅ Main App Content Component
function AppContent() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Suspense fallback={<SuspenseFallback />}>
          <Routes location={location} key={location.pathname}>
            {/* ✅ Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Dashboard />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="/simulation"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Simulation />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Reports />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Settings />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/logbook"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Logbook />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Monitoring />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Alerts />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            {/* ✅ NEW Day 27 - AI Predictions Page */}
            <Route
              path="/predictions"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Predictions />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />

            {/* ✅ Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <PageWrapper>
                    <Login />
                  </PageWrapper>
                </PublicRoute>
              }
            />

            {/* ✅ Enhanced 404 page */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                      404 - Page Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                      The page you're looking for doesn't exist or has been moved to a different location.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        ← Go Back
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🏠 Home
                      </motion.button>
                    </div>
                    
                    {/* Quick Navigation */}
                    <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-600">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Or explore these sections:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
                        <a 
                          href="/" 
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                        >
                          <div className="text-2xl mb-1">📊</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Dashboard</div>
                        </a>
                        <a 
                          href="/simulation" 
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                        >
                          <div className="text-2xl mb-1">🌱</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Simulation</div>
                        </a>
                        <a 
                          href="/predictions" 
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                        >
                          <div className="text-2xl mb-1">🤖</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">AI Predictions</div>
                        </a>
                        <a 
                          href="/monitoring" 
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                        >
                          <div className="text-2xl mb-1">📈</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Monitoring</div>
                        </a>
                        <a 
                          href="/alerts" 
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                        >
                          <div className="text-2xl mb-1">🚨</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Alerts</div>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Layout>
  );
}

// ✅ Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The application encountered an unexpected error. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Page
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ Main App Component with enhanced error boundary
export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <AuthProvider>
          <SimulationProvider>
            <DashboardProvider>
              <AppContent />
            </DashboardProvider>
          </SimulationProvider>
        </AuthProvider>
      </div>
    </ErrorBoundary>
  );
}