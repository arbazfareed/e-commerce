import axios from 'axios';

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const productionBackendUrl = 'https://e-commerce-backend-afjdevops.vercel.app';

const configuredApiUrl = import.meta.env.VITE_API_URL
  || (isBrowser && !isLocalhost ? productionBackendUrl : 'http://localhost:5000');
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

// Expire the session in-app on 401 so route guards can redirect without a full page reload.
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || '';
    const isAuthRequest = requestUrl.includes('/api/auth/login')
      || requestUrl.includes('/api/auth/admin/login')
      || requestUrl.includes('/api/auth/register');
    if (err.response?.status === 401 && !isAuthRequest && localStorage.getItem('user')) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('ic-session-expired'));
    }
    return Promise.reject(err);
  }
);

export default API;
