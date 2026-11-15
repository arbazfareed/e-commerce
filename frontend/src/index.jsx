import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Analytics } from '@vercel/analytics/react';

// Vercel Web Analytics: page views only, no cookies. Turn it on in Vercel → e-commerce → Analytics.
// Admin, password-reset and order-tracking links are kept out (they contain private tokens).
const analyticsBeforeSend = (event) => {
  try {
    const url = new URL(event.url);
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/reset-password')) return null;
    if (url.pathname.startsWith('/track/')) return { ...event, url: `${url.origin}/track` };
    url.search = '';
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
};

try {
  if (localStorage.getItem('ic_theme_preference') === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  }
} catch {
  // The app remains usable in light mode when browser storage is unavailable.
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Analytics beforeSend={analyticsBeforeSend} />
  </React.StrictMode>
);
