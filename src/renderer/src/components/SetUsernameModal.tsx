import { useState } from 'react';
import {
  ensureProfile,
  updateProfile,
  validateUsername,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from '../lib/chat';

interface SetUsernameModalProps {
  onComplete: () => void;
}

export function SetUsernameModal({ onComplete }: SetUsernameModalProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = validateUsername(username);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLoading(true);
    try {
      await ensureProfile(result.value);
      await updateProfile({ display_name: result.value });
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-username-modal-title"
    >
      <div className="w-full max-w-md bg-surface-800 rounded-2xl border border-white/10 shadow-2xl p-8">
        <h1 id="set-username-modal-title" className="text-xl font-bold text-white mb-2">
          Choose your username
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          This is how you'll appear in the app. You can change it later in Settings.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              autoFocus
              maxLength={USERNAME_MAX_LENGTH}
              className="w-full px-4 py-3 rounded-lg bg-surface-900 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              {USERNAME_MIN_LENGTH}–{USERNAME_MAX_LENGTH} characters, letters, numbers, _ and -
            </p>
          </div>
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
