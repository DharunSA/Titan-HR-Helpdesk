import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import logo from '../assets/titan-logo.png';
import logo1 from '../assets/logo.png';
import bgImage from '../assets/new_bg.jpg';
import { showErrorToast, showSuccessToast } from '../utils/toastUtils';
import { useCompany } from '../context/CompanyContext';

import { API_BASE_URL } from '../config';

const ForgotPassword = () => {
  const cardRef = useRef(null);
  const { company } = useCompany();
  const logoSrc = company.logo || logo1;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

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
    setLoading(true);
    setDevResetUrl('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setSent(true);
      // In dev (no SMTP configured) the server returns the link directly.
      if (res.data?.devResetUrl) {
        setDevResetUrl(res.data.devResetUrl);
      }
      showSuccessToast('If that email exists, a reset link is on its way.');
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Unable to send reset link. Please try again.');
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

        {!sent ? (
          <>
            <div className="text-4xl mb-3 text-accent-400">
              <FiMail />
            </div>
            <h2 className="text-xl font-bold text-center mb-2 bg-gradient-to-r from-accent-400 to-teal-600 text-transparent bg-clip-text">
              Forgot Your Password?
            </h2>
            <p className="text-sm text-center italic text-gray-300 mb-4">
              Enter your registered email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="w-full">
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 mb-4 rounded border border-gray-300 bg-white/90
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
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-center mb-2 text-accent-400">Check your email</h2>
            <p className="text-sm text-center text-gray-300 mb-4">
              If an account exists for <span className="text-white">{email}</span>, a password reset
              link has been sent. The link expires in 1 hour.
            </p>

            {devResetUrl && (
              <div className="w-full mb-4 rounded border border-yellow-700 bg-yellow-900/30 p-3 text-xs text-yellow-200">
                <p className="font-semibold mb-1">Dev mode (email not configured):</p>
                <Link to={devResetUrl.replace(/^https?:\/\/[^/]+/, '')} className="underline break-all text-yellow-300">
                  Open reset link →
                </Link>
              </div>
            )}

            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-sm text-gray-300 hover:underline"
            >
              Use a different email
            </button>
          </>
        )}

        <Link
          to="/"
          className="mt-6 flex items-center gap-2 text-sm text-white hover:underline"
        >
          <FiArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
