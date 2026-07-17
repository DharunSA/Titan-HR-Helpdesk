// Titan/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { showErrorToast } from '../utils/toastUtils';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

import { API_BASE_URL } from '../config';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const logout = useCallback((message) => {
    clearLogoutTimer();
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);

    if (message) {
      showErrorToast(message);
    }
  }, []);

  const hydrateSession = useCallback(async (activeToken) => {
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
      const serverUser = res.data?.user || res.data;
      setUser(serverUser);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        logout('Your session expired. Please sign in again.');
        return;
      }

      const decoded = decodeToken(activeToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role || 'employee',
        });
      } else {
        logout('Your session is no longer valid. Please sign in again.');
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!token) {
      clearLogoutTimer();
      return undefined;
    }

    const decoded = decodeToken(token);
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : null;

    clearLogoutTimer();

    if (expiresAt) {
      const timeUntilExpiry = expiresAt - Date.now();

      if (timeUntilExpiry <= 0) {
        logout('Your session expired. Please sign in again.');
        return undefined;
      }

      logoutTimerRef.current = setTimeout(() => {
        logout('Your session expired. Please sign in again.');
      }, timeUntilExpiry);
    }

    return () => clearLogoutTimer();
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      hydrateSession(token);
      return;
    }

    clearLogoutTimer();
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  }, [token, hydrateSession]);

  useEffect(() => {
    const handleLogoutEvent = (event) => {
      logout(event.detail?.message);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [logout]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const { token: userToken, user: userData } = res.data;
      
      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed. Please check credentials.' 
      };
    }
  };

  // Apply an updated session after the user changes their own account details
  // (a fresh token is issued server-side because the JWT embeds email/name).
  const updateSession = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    if (newUser) {
      setUser(newUser);
    }
  }, []);

  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateSession, isAdmin, isEmployee, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
