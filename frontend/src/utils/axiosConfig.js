import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
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
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
