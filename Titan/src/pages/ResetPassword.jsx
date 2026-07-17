import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import logo from '../assets/titan-logo.png';
import logo1 from '../assets/logo.png';
import bgImage from '../assets/new_bg.jpg';
import { showErrorToast, showSuccessToast } from '../utils/toastUtils';
import { useCompany } from '../context/CompanyContext';

import { API_BASE_URL } from '../config';

const ResetPassword = () => {
  const cardRef = useRef(null);
  const { token } = useParams();
  const navigate = useNavigate();
  const { company } = useCompany();
  const logoSrc = company.logo || logo1;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < 6) {
      return showErrorToast('Password must be at least 6 characters');
    }
    if (password !== confirm) {
      return showErrorToast('Passwords do not match');
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password/${token}`, { newPassword: password });
      setDone(true);
      showSuccessToast('Password reset successfully. Please sign in.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/70 z-0" />
      <img src={logo} alt="Titan Logo" className="absolute top-6 right-4 h-24 z-10" />

      <div
        ref={cardRef}
        className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/10
        rounded-xl shadow-xl max-w-sm w-full p-8 text-white flex flex-col items-center"
      >
        <img src={logoSrc} alt="Inner Logo" className="mx-auto mb-2 h-20 max-h-20 object-contain" />

        {!done ? (
          <>
            <div className="text-4xl mb-3 text-accent-400">
              <FiLock />
            </div>
            <h2 className="text-xl font-bold text-center mb-2 bg-gradient-to-r from-accent-400 to-teal-600 text-transparent bg-clip-text">
              Set a New Password
            </h2>
            <p className="text-sm text-center italic text-gray-300 mb-4">
              Choose a strong password you haven't used before.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 pr-10 rounded border border-gray-300 bg-white/90
                  placeholder:text-sm placeholder:italic placeholder:text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-accent-500 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 bg-white/90
                placeholder:text-sm placeholder:italic placeholder:text-gray-700
                focus:outline-none focus:ring-2 focus:ring-accent-500 text-black"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold bg-teal-700 text-white py-2 rounded hover:bg-teal-800 transition
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                )}
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-center mb-2 text-accent-400">Password updated</h2>
            <p className="text-sm text-center text-gray-300">
              Your password has been reset. Redirecting you to sign in…
            </p>
          </>
        )}

        <Link to="/" className="mt-6 flex items-center gap-2 text-sm text-white hover:underline">
          <FiArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
