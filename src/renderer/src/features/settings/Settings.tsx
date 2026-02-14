import { useState, useEffect } from 'react';
import {
  getProfile,
  updateProfile,
  ensureProfile,
  validateUsername,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from '../../lib/chat';

export function Settings() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    ensureProfile()
      .then(() => getProfile())
      .then((profile) => {
        if (!cancelled && profile) setUsername(profile.display_name ?? '');
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const result = validateUsername(username);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ display_name: result.value });
      setMessage('Username saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Username
          </label>
          <p className="text-sm text-gray-500 mb-2">
            This is how you appear in chat. Same as the one you set when you joined.
          </p>
          <input
            id="username"
            type="text"
            className="w-full px-4 py-3 rounded-lg bg-surface-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            disabled={saving}
            maxLength={USERNAME_MAX_LENGTH}
            autoComplete="username"
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
        {message && (
          <p className="text-green-400 text-sm" role="status">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
