import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Include session cookies on all fetch requests (needed for cross-origin dev, harmless in prod)
const _origFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => _origFetch(input, { credentials: 'include', ...init });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
