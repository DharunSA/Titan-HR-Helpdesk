// Titan/src/context/CompanyContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CompanyContext = createContext(null);

import { API_BASE_URL } from '../config';

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState({ logo: '', companyName: '' });

  const refreshCompany = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/settings/public`);
      setCompany({
        logo: res.data?.logo || '',
        companyName: res.data?.companyName || '',
      });
    } catch {
      // Branding is non-critical; fall back to the bundled assets on failure.
    }
  }, []);

  useEffect(() => {
    refreshCompany();
  }, [refreshCompany]);

  return (
    <CompanyContext.Provider value={{ company, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return ctx;
};
