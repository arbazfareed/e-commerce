import { createContext, useState, useContext } from 'react';
import API from '../utils/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const persist = (data) => { setUser(data); localStorage.setItem('user', JSON.stringify(data)); };

  const register = async (fields) => {
    const { data } = await API.post('/api/auth/register', fields);
    persist(data); return data;
  };

  const login = async (email, password) => {
    const { data } = await API.post('/api/auth/login', { email, password });
    persist(data); return data;
  };

  const logout = () => { setUser(null); localStorage.removeItem('user'); };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
