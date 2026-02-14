import { useState } from 'react';
import type { Message } from '../../lib/chat';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  );
}

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

export function MessageItem({ message, isOwn, onEdit, onDelete }: MessageItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);

  const displayName = message.display_name || 'User';

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content && onEdit) {
      onEdit(message.id, trimmed);
    }
    setEditing(false);
    setEditValue(message.content);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditValue(message.content);
  };

  return (
    <li
      className={`py-3 px-4 rounded-lg group ${
        isOwn ? 'bg-brand-500/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-brand-300">{displayName}</span>
        <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
        {message.updated_at !== message.created_at && (
          <span className="text-xs text-gray-500">(edited)</span>
        )}
        {isOwn && !editing && (
          <span className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button
              type="button"
              className="text-xs text-brand-400 hover:text-brand-300"
              onClick={() => setEditing(true)}
              aria-label="Edit"
            >
              Edit
            </button>
            <button
              type="button"
              className="text-xs text-red-400 hover:text-red-300"
              onClick={() => onDelete?.(message.id)}
              aria-label="Delete"
            >
              Delete
            </button>
          </span>
        )}
      </div>
      {editing ? (
        <div className="mt-2">
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-surface-900 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveEdit();
              }
              if (e.key === 'Escape') handleCancelEdit();
            }}
            rows={2}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="px-3 py-1 text-sm rounded bg-brand-600 hover:bg-brand-500 text-white"
              onClick={handleSaveEdit}
            >
              Save
            </button>
            <button
              type="button"
              className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20 text-gray-300"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-gray-200 whitespace-pre-wrap">{message.content}</p>
      )}
    </li>
  );
}
