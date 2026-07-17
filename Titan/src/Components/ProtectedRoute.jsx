// Titan/src/Components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      toast.error(`Access Denied: You do not have permissions for this page.`);
    }
  }, [user, loading, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
        <span className="ml-3">Verifying session...</span>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page if not logged in
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard if they don't have access to this page
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
