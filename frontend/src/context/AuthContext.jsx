import { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('user');
      setUser(null);
    };
    window.addEventListener('ic-session-expired', handleSessionExpired);
    return () => window.removeEventListener('ic-session-expired', handleSessionExpired);
  }, []);

  const persist = (data) => {
    const normalized = { ...data, city: data?.city || '' };
    setUser(normalized);
    localStorage.setItem('user', JSON.stringify(normalized));
    localStorage.removeItem('checkout_address');
  };

  useEffect(() => {
    let active = true;
    const stored = localStorage.getItem('user');
    if (!stored) {
      setAuthReady(true);
      return () => { active = false; };
    }

    let storedUser;
    try { storedUser = JSON.parse(stored); }
    catch {
      localStorage.removeItem('user');
      setAuthReady(true);
      return () => { active = false; };
    }

    API.get('/api/auth/session')
      .then(({ data }) => {
        if (active) persist({ ...data.user, token: storedUser.token });
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        localStorage.removeItem('user');
      })
      .finally(() => { if (active) setAuthReady(true); });

    return () => { active = false; };
  }, []);

  const register = async (fields) => {
    const { data } = await API.post('/api/auth/register', fields);
    persist(data); return data;
  };

  const login = async (email, password, { adminOnly = false } = {}) => {
    const loginEndpoint = adminOnly ? '/api/auth/admin/login' : '/api/auth/login';
    const { data } = await API.post(loginEndpoint, { email: email.trim(), password });
    if (adminOnly && !data.isAdmin) {
      const error = new Error('This account does not have administrator access.');
      error.code = 'ADMIN_ACCESS_REQUIRED';
      throw error;
    }
    persist(data); return data;
  };

  const logout = () => { setUser(null); localStorage.removeItem('user'); };

  if (!authReady) return null;

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
