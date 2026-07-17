import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import logo from '../assets/titan-logo.png';
import logo1 from '../assets/logo.png';
import bgImage from '../assets/new_bg.jpg';
import Glogo from '../assets/Google__G__logo.svg.png';

import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { showErrorToast, showSuccessToast } from '../utils/toastUtils';

const Login = () => {
  const loginRef = useRef(null);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { company } = useCompany();
  const logoSrc = company.logo || logo1;

  const log = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        showSuccessToast(`Welcome back, ${res.user?.name || 'there'}!`);
        navigate("/dashboard");
      } else {
        showErrorToast(res.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    gsap.fromTo(
      loginRef.current,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
    );
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/70 z-0" />
      <img src={logo} alt="Titan Logo" className="absolute top-6 right-4 h-24 z-10" />

      <div className="relative z-10 flex w-full max-w-[90%] justify-between items-center gap-8 px-6 lg:px-10">
        <div
          ref={loginRef}
          className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl shadow-xl max-w-sm w-full p-8"
        >
          <img src={logoSrc} alt="Inner Logo" className="mx-auto mb-6 h-20 max-h-20 object-contain" />
          <form onSubmit={log} className="space-y-5">
            <input
              type="email"
              placeholder="Enter your Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 bg-white/90
              placeholder:text-sm placeholder:italic placeholder:text-gray-700
              focus:outline-none focus:ring-2 focus:ring-accent-500 text-black"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your Password"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold bg-teal-700 text-white py-2 rounded hover:bg-teal-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Login'}
            </button>

            <div className="flex items-center my-3">
              <hr className="flex-grow border-t border-white/30" />
              <span className="mx-2 text-white text-sm">or</span>
              <hr className="flex-grow border-t border-white/30" />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-4 bg-black/80 text-white py-2 rounded shadow hover:bg-teal-900 transition"
            >
              <img src={Glogo} alt="Google logo" className="w-5 h-5" />
              Sign in with Google
            </button>
          </form>

          <Link
            to="/forgot-password"
            className="block mt-4 text-sm text-white text-center hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
