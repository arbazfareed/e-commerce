import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

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
  </React.StrictMode>
);
