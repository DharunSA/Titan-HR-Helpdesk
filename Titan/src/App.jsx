import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CompanyProvider } from './context/CompanyContext';
import ProtectedRoute from './Components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import ForgotPassword from './pages/FP';
import ResetPassword from './pages/ResetPassword';
import Attendance from './pages/Attendance';
import Project from './pages/Project';
import LeaveManagement from './pages/LeaveManagement';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <CompanyProvider>
      <Router>
        <>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Shared Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/project-management" element={<ProtectedRoute><Project /></ProtectedRoute>} />
            <Route path="/leave-management" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Protected Admin-Only Routes */}
            <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin']}><Employees /></ProtectedRoute>} />
          </Routes>

          {/* ToastContainer placed at root level */}
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick theme="dark" />
        </>
      </Router>
      </CompanyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
