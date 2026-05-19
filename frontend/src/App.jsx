import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar          from './components/Navbar';
import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import CartPage        from './pages/CartPage';
import OrdersPage      from './pages/OrdersPage';
import OrderTrackPage  from './pages/OrderTrackPage';
import AdminPage       from './pages/AdminPage';
import SupportPage     from './pages/SupportPage';

/* Redirect logged-in users away from guest-only pages */
const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return children;
  return <Navigate to={user.isAdmin ? '/admin' : '/'} replace />;
};

/* Redirect unauthenticated users to login */
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

/* Admin-only route */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user)         return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/"      replace />;
  return children;
};

/* Root route: admin → /admin, user → HomePage */
const RootRoute = () => {
  const { user } = useAuth();
  if (user?.isAdmin) return <Navigate to="/admin" replace />;
  return <HomePage />;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/"               element={<RootRoute />} />
      <Route path="/login"          element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register"       element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/cart"           element={<PrivateRoute><CartPage /></PrivateRoute>} />
      <Route path="/orders"         element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
      <Route path="/orders/:id"     element={<PrivateRoute><OrderTrackPage /></PrivateRoute>} />
      <Route path="/admin"          element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/support"        element={<SupportPage />} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
