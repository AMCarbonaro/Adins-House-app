import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface WelcomeLetterModalProps {
  onEnter: () => void;
}

export function WelcomeLetterModal({ onEnter }: WelcomeLetterModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnter = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { has_seen_welcome: true },
      });
      if (updateError) throw updateError;
      onEnter?.();
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
      aria-labelledby="welcome-modal-title"
    >
      <div className="w-full max-w-lg bg-surface-800 rounded-2xl border border-white/10 shadow-2xl p-8">
        <h1 id="welcome-modal-title" className="text-xl font-bold text-white mb-2">
          Welcome to Step Bro
        </h1>
        <p className="text-brand-400/80 text-sm mb-6">A letter from Adin Zander</p>
        <div className="space-y-4 text-gray-300 mb-6">
          <p>
            Hey — thanks for signing up. You're in the right place. This is where
            you get the tools: OnlyFans Secrets, SnapBot, Trident CRM, and a way
            to be part of what I'm building.
          </p>
          <p>
            No fluff. Just one dashboard, one login. Use what you need and we'll
            keep adding more. Let's go.
          </p>
          <p className="text-brand-400/90">— Adin Zander, Step Bro</p>
        </div>
        {error && (
          <p className="text-red-400 text-sm mb-4" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleEnter}
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition disabled:opacity-50"
        >
          {loading ? 'Entering…' : 'Enter the community'}
        </button>
      </div>
    </div>
  );
}
