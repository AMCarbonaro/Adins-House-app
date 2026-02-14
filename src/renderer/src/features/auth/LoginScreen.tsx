import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import gif1 from '../../assets/tumblr_m3qiwhMOBK1qlo9hgo1_500.gif';
import gif2 from '../../assets/tumblr_m3qkomNv9M1qlo9hgo1_500.gif';

const GIF_SWITCH_MS = 5000;

interface LoginScreenProps {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [activeGif, setActiveGif] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveGif((n) => (n + 1) % 2), GIF_SWITCH_MS);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await signUp(email.trim(), password);
        if (err) throw err;
        setSignupSuccess(true);
        setMode('signin');
      } else {
        const { data, error: err } = await signIn(email.trim(), password);
        if (err) throw err;
        onSuccess();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setSignupSuccess(false);
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
  };

  return (
    <div className="relative h-full min-h-0 flex items-center justify-center overflow-hidden p-4">
      {/* Animated GIF background - alternate full screen */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
          activeGif === 0 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${gif1})` }}
      />
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
          activeGif === 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundImage: `url(${gif2})` }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-surface-950/75 backdrop-blur-sm" />
      {/* Login box */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-surface-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-1">
            Step Bro
          </h1>
          <p className="text-brand-400/80 text-sm text-center mb-6">by Adin Zander</p>

          {signupSuccess && (
            <p
              className="text-green-400/90 text-sm mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              role="status"
            >
              Account created. Check your email (including spam) for a confirmation
              link. Once confirmed, log in below.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-surface-900/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-surface-900/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? mode === 'signup'
                  ? 'Creating account…'
                  : 'Signing in…'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </button>

            <p className="text-center text-sm text-gray-400">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-brand-400 hover:text-brand-300 font-medium"
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-brand-400 hover:text-brand-300 font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
