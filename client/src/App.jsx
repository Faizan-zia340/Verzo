import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import lazyWithRetry from './utils/lazyWithRetry.js';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CreditProvider } from './context/CreditContext.js';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import FeedbackButton from './components/FeedbackButton.jsx';
import Home from './pages/Home.jsx';
// Route-level code splitting: Home stays eager (it is the landing page),
// every other page loads on demand so the first visit only downloads the
// code it needs. Before this, all 15 pages shipped in one ~1.2 MB bundle
// and the site felt slow to load, especially on phones.
const Login = lazy(lazyWithRetry(() => import('./pages/Login.jsx')));
const Register = lazy(lazyWithRetry(() => import('./pages/Register.jsx')));
const ForgotPassword = lazy(lazyWithRetry(() => import('./pages/ForgotPassword.jsx')));
const ResetPassword = lazy(lazyWithRetry(() => import('./pages/ResetPassword.jsx')));
const VerifyEmail = lazy(lazyWithRetry(() => import('./pages/VerifyEmail.jsx')));
const Dashboard = lazy(lazyWithRetry(() => import('./pages/Dashboard.jsx')));
const Pricing = lazy(lazyWithRetry(() => import('./pages/Pricing.jsx')));
const PaymentSuccess = lazy(lazyWithRetry(() => import('./pages/PaymentSuccess.jsx')));
const Admin = lazy(lazyWithRetry(() => import('./pages/Admin.jsx')));
const PDFAnalyzer = lazy(lazyWithRetry(() => import('./pages/PDFAnalyzer.jsx')));
const Privacy = lazy(lazyWithRetry(() => import('./pages/Privacy.jsx')));
const BlogList = lazy(lazyWithRetry(() => import('./pages/BlogList.jsx')));
const BlogPost = lazy(lazyWithRetry(() => import('./pages/BlogPost.jsx')));
const NotFound = lazy(lazyWithRetry(() => import('./pages/NotFound.jsx')));

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
};

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

// Shown while a lazy page chunk downloads (first visit to that page).
// Same teak dots as the auth spinner, so the wait looks intentional.
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-teak-500"
          animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.13, ease: 'easeInOut' }}
        />
      ))}
    </div>
  </div>
);

const AuthSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-teak-500"
          animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.13, ease: 'easeInOut' }}
        />
      ))}
    </div>
  </div>
);

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
          <Route path="/reset-password/:token" element={<PageWrapper><ResetPassword /></PageWrapper>} />
          <Route path="/verify-email/:token" element={<PageWrapper><VerifyEmail /></PageWrapper>} />
          <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
          <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
          <Route path="/blog" element={<PageWrapper><BlogList /></PageWrapper>} />
          <Route path="/blog/:slug" element={<PageWrapper><BlogPost /></PageWrapper>} />
          <Route path="/payment-success" element={<PrivateRoute><PageWrapper><PaymentSuccess /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><PageWrapper><Dashboard /></PageWrapper></PrivateRoute>} />
          <Route path="/pdf" element={<PrivateRoute><PageWrapper><PDFAnalyzer /></PageWrapper></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><PageWrapper><Admin /></PageWrapper></AdminRoute>} />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CreditProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', fontSize: '13px', fontWeight: 500, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
              success: { iconTheme: { primary: '#8b6f47', secondary: '#fff' } },
            }}
          />
          <Navbar />
          <AnimatedRoutes />
          <Footer />
          <FeedbackButton />
        </BrowserRouter>
      </CreditProvider>
    </AuthProvider>
  );
}
