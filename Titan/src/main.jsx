import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { showErrorToast, getErrorMessage } from './utils/toastUtils'

// Global Axios Interceptor to automatically attach JWT token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // 401 = unauthenticated (expired / missing token) → force logout
      localStorage.removeItem('token');
      window.dispatchEvent(
        new CustomEvent('auth:logout', {
          detail: { message: 'Your session expired. Please sign in again.' },
        })
      );
    }
    // 403 = authenticated but forbidden — do NOT log out, just let the
    // component or the general error handler below show the toast.
    else if (error.response || error.message) {
      showErrorToast(getErrorMessage(error, 'Request failed'));
    }

    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
