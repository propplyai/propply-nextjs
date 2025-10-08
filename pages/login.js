import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Building2, Mail, Lock, Chrome, AlertCircle, Loader2 } from 'lucide-react';
import { authHelpers } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if signup query param is present
    if (router.query.signup === 'true') {
      setIsSignUp(true);
    }
    
    // Check for error messages in query params
    if (router.query.error) {
      const errorMessage = decodeURIComponent(router.query.error);
      const errorMap = {
        'session_expired': 'Your session has expired. Please log in again.',
        'session_failed': 'Failed to establish session. Please try again.',
        'auth_failed': 'Authentication failed. Please try again.',
        'unexpected': 'An unexpected error occurred. Please try again.',
      };
      setError(errorMap[errorMessage] || errorMessage);
    }

    // Check if user is already logged in
    const checkAuth = async () => {
      const { user } = await authHelpers.getUser();
      if (user) {
        // Redirect to the specified URL or dashboard
        const redirectUrl = router.query.redirect || '/dashboard';
        router.push(redirectUrl);
      }
    };
    checkAuth();
  }, [router.query]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const redirectUrl = router.query.redirect || '/dashboard';
      const planId = router.query.plan;
      
      if (isSignUp) {
        const { data, error } = await authHelpers.signUp(email, password);
        if (error) throw error;
        setMessage('Check your email to confirm your account!');
        setTimeout(() => router.push(redirectUrl), 2000);
      } else {
        const { data, error } = await authHelpers.signIn(email, password);
        if (error) throw error;
        
        // If there's a plan ID, trigger checkout immediately
        if (planId) {
          // Redirect back to pricing with plan parameter
          // The pricing component will handle the checkout
          router.push(`${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}autoCheckout=${planId}`);
        } else {
          router.push(redirectUrl);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      // Store redirect info in localStorage for OAuth callback
      const redirectUrl = router.query.redirect;
      const planId = router.query.plan;
      console.log('[Login] Redirect params:', { redirectUrl, planId });
      
      if (redirectUrl || planId) {
        const redirectData = { redirectUrl, planId };
        console.log('[Login] Storing redirect data:', redirectData);
        localStorage.setItem('auth_redirect', JSON.stringify(redirectData));
        console.log('[Login] Stored in localStorage:', localStorage.getItem('auth_redirect'));
      } else {
        console.log('[Login] No redirect params to store');
      }
      
      const { error } = await authHelpers.signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-corporate-500/20 to-gold-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-500/20 to-corporate-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-xl flex items-center justify-center shadow-enterprise">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">Propply AI</span>
        </Link>

        {/* Auth Card */}
        <div className="card">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 text-center mb-8">
            {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-ruby-500/10 border border-ruby-500/30 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-ruby-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ruby-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-300">{message}</p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800 text-slate-400">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-modern pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="input-modern pl-11"
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 text-slate-400">
                  <input type="checkbox" className="rounded border-slate-700 text-corporate-500 focus:ring-corporate-500" />
                  <span>Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-corporate-400 hover:text-corporate-300">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <p className="text-center text-slate-400 text-sm mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-corporate-400 hover:text-corporate-300 font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
