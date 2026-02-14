import { useState, useEffect } from 'react';
import { useLeadStore } from '../../stores/leadStore';
import { FUNNEL_STAGES } from '../../lib/trident/constants';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStage?: string;
}

const defaultPayload = () => ({
  displayName: '',
  instagramUsername: '',
  snapchatUsername: '',
  notes: '',
  stage: FUNNEL_STAGES.INSTAGRAM_FOLLOWED,
});

export function AddLeadModal({
  isOpen,
  onClose,
  defaultStage,
}: AddLeadModalProps) {
  const addLead = useLeadStore((s) => s.addLead);
  const [form, setForm] = useState(defaultPayload);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && defaultStage) {
      setForm((prev) => ({ ...prev, stage: defaultStage }));
    } else if (isOpen) {
      setForm(defaultPayload());
    }
  }, [isOpen, defaultStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const now = new Date();
    const platforms: Record<string, { username: string }> = {};
    if (form.instagramUsername) {
      platforms.instagram = {
        username: form.instagramUsername.replace(/^@/, '').trim(),
      };
    }
    if (form.snapchatUsername) {
      platforms.snapchat = { username: form.snapchatUsername.trim() };
    }
    const initialNotes = form.notes.trim()
      ? [
          {
            id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            text: form.notes.trim(),
            createdAt: now,
          },
        ]
      : [];

    try {
      await addLead({
        platforms,
        displayName: form.displayName.trim() || 'New Lead',
        stage: defaultStage || form.stage,
        tags: [],
        notes: initialNotes,
        engagement: {
          replySpeed: 12,
          activityLevel: 'medium',
          lastActivityAt: now,
          totalInteractions: 0,
          engagementScore: 50,
        },
        monetization: {
          offers: [],
          payments: [],
          totalRevenue: 0,
          averageOfferValue: 0,
        },
        reminders: [],
        priority: 'medium',
        isHighValue: false,
        isDormant: false,
        lastContactAt: now,
        metadata: {},
      });
      setForm(defaultPayload());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-800 rounded-xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Add Lead</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="text-red-400 text-sm p-3 rounded-lg bg-red-500/10">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="trident-displayName"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Display Name
              </label>
              <input
                id="trident-displayName"
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-surface-900 border border-white/10 text-white"
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
                placeholder="Enter name"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="trident-ig"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Instagram Username
              </label>
              <input
                id="trident-ig"
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-surface-900 border border-white/10 text-white"
                value={form.instagramUsername}
                onChange={(e) =>
                  setForm((f) => ({ ...f, instagramUsername: e.target.value }))
                }
                placeholder="@username"
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="trident-snap"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Snapchat Username
              </label>
              <input
                id="trident-snap"
                type="text"
                className="w-full px-4 py-2 rounded-lg bg-surface-900 border border-white/10 text-white"
                value={form.snapchatUsername}
                onChange={(e) =>
                  setForm((f) => ({ ...f, snapchatUsername: e.target.value }))
                }
                placeholder="username"
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="trident-notes"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Notes
              </label>
              <textarea
                id="trident-notes"
                className="w-full px-4 py-2 rounded-lg bg-surface-900 border border-white/10 text-white resize-none"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Add any notes..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
          <div className="p-6 pt-0 flex gap-3 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
