import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { CreditProvider } from './context/CreditContext.js';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pricing from './pages/Pricing.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import Admin from './pages/Admin.jsx';
import PDFAnalyzer from './pages/PDFAnalyzer.jsx';

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

const AuthSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-500"
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
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        <Route path="/reset-password/:token" element={<PageWrapper><ResetPassword /></PageWrapper>} />
        <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
        <Route path="/payment-success" element={<PageWrapper><PaymentSuccess /></PageWrapper>} />
        <Route path="/dashboard" element={<PrivateRoute><PageWrapper><Dashboard /></PageWrapper></PrivateRoute>} />
        <Route path="/pdf" element={<PrivateRoute><PageWrapper><PDFAnalyzer /></PageWrapper></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><PageWrapper><Admin /></PageWrapper></AdminRoute>} />
      </Routes>
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
              style: { borderRadius: '12px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            }}
          />
          <Navbar />
          <AnimatedRoutes />
        </BrowserRouter>
      </CreditProvider>
    </AuthProvider>
  );
}
