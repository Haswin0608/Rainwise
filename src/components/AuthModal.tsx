import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../lib/firebase';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
  onContinueAsGuest?: () => void;
  initialMode?: 'signin' | 'signup';
  customTitle?: string;
  customSubtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onContinueAsGuest,
  initialMode = 'signin',
  customTitle,
  customSubtitle,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (onSuccess) onSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in cancelled.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // user clicked multiple times
      } else {
        setError(err.message || 'Could not sign in with Google. Please try email or continue as guest.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let user: AuthUser;
      if (mode === 'signup') {
        user = await registerWithEmail(email, password, name);
      } else {
        user = await loginWithEmail(email, password);
      }
      if (onSuccess) onSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please check and try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
        setMode('signin');
      } else if (err.code === 'auth/weak-password') {
        setError('Please use a stronger password (at least 6 characters).');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Authentication failed. You can always continue as guest.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🌧️</span>
                <h3 className="text-xl font-bold font-['Outfit',sans-serif] text-slate-900">
                  {customTitle || (mode === 'signin' ? 'Welcome Back to RainWise' : 'Create Your Free Account')}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                {customSubtitle || 'Save your farm or house measurements so you never have to re-enter them.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 pt-4 space-y-5">
            {/* Google Sign-In Button */}
            <button
              type="button"
              id="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-sm sm:text-base shadow-2xs transition-all cursor-pointer disabled:opacity-60 min-h-[48px]"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-teal-700" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200"></div>
              <span className="absolute px-3 bg-white text-xs text-slate-400 font-medium">
                or with email
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signin' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Name (optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="auth-submit-btn"
                disabled={loading || googleLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 min-h-[48px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            {/* Guest fallback option */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                id="auth-continue-guest-btn"
                onClick={() => {
                  if (onContinueAsGuest) onContinueAsGuest();
                  onClose();
                }}
                className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer py-1"
              >
                Continue as Guest without saving
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
