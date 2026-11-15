import { Suspense, lazy, useEffect } from 'react';
import API from './utils/axiosConfig';
import { applyStoreRates } from './utils/priceUtils';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar          from './components/Navbar';
import Footer          from './components/Footer';
import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
import RegisterPage    from './pages/RegisterPage';
import CartPage        from './pages/CartPage';
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderTrackPage = lazy(() => import('./pages/OrderTrackPage'));
const InvoicePage = lazy(() => import('./pages/InvoicePage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
import ProductDetailPage from './pages/ProductDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';

/* Redirect logged-in users away from guest-only pages */
const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  const adminTarget = import.meta.env.VITE_APP_MODE === 'shopper'
    ? import.meta.env.VITE_ADMIN_PORTAL_URL || `${window.location.protocol}//${window.location.hostname}:3001/admin/login`
    : '/admin';
  return <Navigate to={user.isAdmin ? adminTarget : '/'} replace />;
};

/* Redirect unauthenticated users to login */
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AdminLoginRoute = ({ children, adminPortal = false }) => {
  const { user } = useAuth();
  if (!user) return children;
  if (user.isAdmin) return <Navigate to="/admin" replace />;
  return adminPortal ? children : <Navigate to="/" replace />;
};

/* Admin-only route */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user)         return <Navigate to="/admin/login" replace />;
  if (!user.isAdmin) return <Navigate to="/"      replace />;
  return children;
};

/* Root route: admin → /admin, user → HomePage */
const RootRoute = () => {
  const { user } = useAuth();
  if (user?.isAdmin) {
    const adminTarget = import.meta.env.VITE_APP_MODE === 'shopper'
      ? import.meta.env.VITE_ADMIN_PORTAL_URL || `${window.location.protocol}//${window.location.hostname}:3001/admin/login`
      : '/admin';
    return <Navigate to={adminTarget} replace />;
  }
  return <HomePage />;
};

const AdminPortalRoot = () => {
  const { user } = useAuth();
  return <Navigate to={user?.isAdmin ? '/admin' : '/admin/login'} replace />;
};

const AdminPortalRoutes = () => (
  <Routes>
    <Route path="/" element={<AdminPortalRoot />} />
    <Route path="/admin/login" element={<AdminLoginRoute adminPortal><LoginPage adminOnly /></AdminLoginRoute>} />
    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
    <Route path="/admin/:section" element={<AdminRoute><AdminPage /></AdminRoute>} />
    <Route path="/support" element={<AdminRoute><SupportPage /></AdminRoute>} />
    <Route path="/orders/:id/invoice" element={<AdminRoute><InvoicePage /></AdminRoute>} />
    <Route path="*" element={<AdminPortalRoot />} />
  </Routes>
);

const ShopperPortalRoutes = () => (
  <Routes>
      <Route path="/"               element={<RootRoute />} />
      <Route path="/products/:id"   element={<ProductDetailPage />} />
      <Route path="/login"          element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<PasswordResetPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register"       element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/cart"           element={<CartPage />} />
      <Route path="/orders"         element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
      <Route path="/wishlist"       element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
      <Route path="/orders/:id"     element={<PrivateRoute><OrderTrackPage /></PrivateRoute>} />
      <Route path="/orders/:id/invoice" element={<PrivateRoute><InvoicePage /></PrivateRoute>} />
      <Route path="/track/:id" element={<OrderTrackPage />} />
      <Route path="/support"        element={<SupportPage />} />
      <Route path="/admin/*" element={<Navigate to={import.meta.env.VITE_ADMIN_PORTAL_URL || `${window.location.protocol}//${window.location.hostname}:3001/admin/login`} replace />} />
      <Route path="*"               element={<NotFoundPage />} />
  </Routes>
);

const SharedPortalRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRoute />} />
    <Route path="/products/:id" element={<ProductDetailPage />} />
    <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
    <Route path="/admin/login" element={<AdminLoginRoute><LoginPage adminOnly /></AdminLoginRoute>} />
    <Route path="/reset-password/:token" element={<PasswordResetPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
    <Route path="/wishlist" element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
    <Route path="/orders/:id" element={<PrivateRoute><OrderTrackPage /></PrivateRoute>} />
    <Route path="/orders/:id/invoice" element={<PrivateRoute><InvoicePage /></PrivateRoute>} />
      <Route path="/track/:id" element={<OrderTrackPage />} />
    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
    <Route path="/admin/:section" element={<AdminRoute><AdminPage /></AdminRoute>} />
    <Route path="/support" element={<SupportPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const AppRoutes = () => {
  const appMode = import.meta.env.VITE_APP_MODE || 'shared';
  const adminPortal = appMode === 'admin';
  const location = useLocation();
  const isAdminDashboard = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  // Load the store's shipping and currency rates once so prices match what the server charges.
  useEffect(() => {
    let active = true;
    Promise.resolve(API.get('/api/settings/public'))
      .then(response => { if (active) applyStoreRates(response?.data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar adminPortal={adminPortal} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Less-visited pages (admin, orders, support…) load on demand to keep the first download small. */}
        <Suspense fallback={<div role="status" aria-live="polite" style={{ padding:'48px 20px', textAlign:'center', color:'#64748b' }}>Loading…</div>}>
          {adminPortal ? <AdminPortalRoutes /> : appMode === 'shopper' ? <ShopperPortalRoutes /> : <SharedPortalRoutes />}
        </Suspense>
      </div>
      {!adminPortal && !isAdminDashboard && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
