import { useEffect, useState } from 'react';
import { useLeadStore } from '../../stores/leadStore';
import { STAGE_LABELS } from '../../lib/trident/constants';
import { formatDistanceToNow } from 'date-fns';
import type { Lead } from '../../lib/trident/leadHelpers';

interface LeadDetailPanelProps {
  leadId: string;
  onClose: () => void;
}

export function LeadDetailPanel({ leadId, onClose }: LeadDetailPanelProps) {
  const getLeadById = useLeadStore((s) => s.getLeadById);
  const updateLead = useLeadStore((s) => s.updateLead);
  const deleteLead = useLeadStore((s) => s.deleteLead);
  const setSelectedLeadId = useLeadStore((s) => s.setSelectedLeadId);
  const [copied, setCopied] = useState<string | null>(null);

  const lead = getLeadById(leadId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!lead) return null;

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUpdate = async (updates: Partial<Lead>) => {
    try {
      await updateLead(lead.id, updates);
    } catch (err) {
      console.error('Failed to update lead', err);
    }
  };

  const handleNoteAdd = (text: string) => {
    if (!text?.trim()) return;
    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      text: text.trim(),
      createdAt: new Date(),
    };
    handleUpdate({ notes: [...(lead.notes || []), newNote] });
  };

  const handleNoteDelete = (id: string) => {
    handleUpdate({
      notes: (lead.notes || []).filter((n) => n.id !== id),
    });
  };

  const handleTagAdd = (tag: string) => {
    const t = tag?.trim();
    if (!t || (lead.tags || []).includes(t)) return;
    handleUpdate({ tags: [...(lead.tags || []), t] });
  };

  const handleTagRemove = (tag: string) => {
    handleUpdate({
      tags: (lead.tags || []).filter((t) => t !== tag),
    });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete lead "${lead.displayName}"?`)) return;
    await deleteLead(lead.id);
    setSelectedLeadId(null);
    onClose();
  };

  const notes = [...(lead.notes || [])].sort((a, b) => {
    const at =
      a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as string);
    const bt =
      b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as string);
    return bt.getTime() - at.getTime();
  });

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 bottom-0 w-96 z-50 bg-surface-800 border-l border-white/10 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trident-detail-title"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 id="trident-detail-title" className="font-semibold text-white truncate">
            {lead.displayName}
          </h2>
          <button
            type="button"
            className="p-2 rounded text-gray-500 hover:text-white hover:bg-white/5"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Identity</h3>
            {lead.platforms?.instagram && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-300">@{lead.platforms.instagram.username}</span>
                <button
                  type="button"
                  className="text-xs text-brand-400 hover:text-brand-300"
                  onClick={() =>
                    handleCopy(lead.platforms!.instagram!.username, 'ig')
                  }
                >
                  {copied === 'ig' ? '✓' : 'Copy'}
                </button>
              </div>
            )}
            {lead.platforms?.snapchat && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-300">
                  {lead.platforms.snapchat.username}
                </span>
                <button
                  type="button"
                  className="text-xs text-brand-400 hover:text-brand-300"
                  onClick={() =>
                    handleCopy(lead.platforms!.snapchat!.username, 'snap')
                  }
                >
                  {copied === 'snap' ? '✓' : 'Copy'}
                </button>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Stage</h3>
            <select
              className="w-full px-4 py-2 rounded-lg bg-surface-900 border border-white/10 text-white"
              value={lead.stage}
              onChange={(e) => handleUpdate({ stage: e.target.value })}
            >
              {Object.entries(STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Notes</h3>
            <ul className="space-y-3 mb-3">
              {notes.length === 0 ? (
                <li className="text-gray-500 text-sm">No notes yet</li>
              ) : (
                notes.map((note) => (
                  <li
                    key={note.id}
                    className="p-3 rounded-lg bg-surface-900 text-sm relative"
                  >
                    <p className="text-gray-300">{note.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(
                        note.createdAt instanceof Date
                          ? note.createdAt
                          : new Date(note.createdAt as string),
                        { addSuffix: true }
                      )}
                    </p>
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                      onClick={() => handleNoteDelete(note.id)}
                      aria-label="Delete note"
                    >
                      ×
                    </button>
                  </li>
                ))
              )}
            </ul>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg bg-surface-900 border border-white/10 text-white text-sm"
              placeholder="Add a note (Enter to save)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNoteAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {(lead.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-500/20 text-brand-300 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    className="hover:text-red-400"
                    onClick={() => handleTagRemove(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg bg-surface-900 border border-white/10 text-white text-sm"
              placeholder="Add tag (Enter)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Engagement
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Score</span>
                <span className="text-gray-300">
                  {lead.engagement?.engagementScore ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reply speed</span>
                <span className="text-gray-300">
                  {lead.engagement?.replySpeed ?? 0}h avg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last activity</span>
                <span className="text-gray-300">
                  {lead.engagement?.lastActivityAt
                    ? formatDistanceToNow(
                        lead.engagement.lastActivityAt instanceof Date
                          ? lead.engagement.lastActivityAt
                          : new Date(lead.engagement.lastActivityAt as string),
                        { addSuffix: true }
                      )
                    : '—'}
                </span>
              </div>
            </div>
          </section>

          <div>
            <button
              type="button"
              className="text-red-400 hover:text-red-300 text-sm"
              onClick={handleDelete}
            >
              Delete Lead
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
