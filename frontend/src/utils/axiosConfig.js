import axios from 'axios';

// Set VITE_API_URL to the address reachable by browsers on other machines
// (for example, http://YOUR_COMPUTER_IP:5000). Keep the default for local development.
const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = configuredApiUrl.replace(/\/+$/, '');

export const assetUrl = (assetPath) => {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const cleanPath = assetPath.replace(/^\/+/, '');
  return `${API_BASE}/${cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`}`;
};

const API = axios.create({
  baseURL: API_BASE,
});

// Attach JWT token automatically on every request
API.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Auto-logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || '';
    const isAuthRequest = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');
    if (err.response?.status === 401 && !isAuthRequest && localStorage.getItem('user')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
