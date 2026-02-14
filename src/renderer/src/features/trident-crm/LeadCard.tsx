import { formatDistanceToNow } from 'date-fns';
import type { Lead } from '../../lib/trident/leadHelpers';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isDragging?: boolean;
}

function priorityColor(p: string | undefined) {
  if (p === 'high') return 'bg-green-500/80';
  if (p === 'low') return 'bg-gray-500/80';
  return 'bg-brand-500/80';
}

function engagementColor(score: number) {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-brand-500';
  return 'bg-gray-500';
}

export function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const lastAt = lead.engagement?.lastActivityAt
    ? lead.engagement.lastActivityAt instanceof Date
      ? lead.engagement.lastActivityAt
      : new Date(lead.engagement.lastActivityAt as string)
    : new Date();
  const score = lead.engagement?.engagementScore ?? 0;

  return (
    <div
      className={`p-3 rounded-lg bg-surface-800 border border-white/5 cursor-pointer transition hover:border-brand-500/30 ${
        isDragging ? 'opacity-90 shadow-xl' : ''
      }`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Lead ${lead.displayName}, stage ${lead.stage}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor(lead.priority)}`}
        />
        <span className="font-medium text-white truncate">
          {lead.displayName || 'Unnamed'}
        </span>
      </div>
      <div className="flex gap-2 mb-2">
        {lead.platforms?.instagram && (
          <span
            className="text-xs px-2 py-0.5 rounded bg-surface-700 text-gray-400"
            title={`@${lead.platforms.instagram.username}`}
          >
            IG
          </span>
        )}
        {lead.platforms?.snapchat && (
          <span
            className="text-xs px-2 py-0.5 rounded bg-surface-700 text-gray-400"
            title={lead.platforms.snapchat.username}
          >
            SC
          </span>
        )}
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Engagement</span>
          <span>{score}</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden">
          <div
            className={`h-full rounded-full ${engagementColor(score)} transition-all`}
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
      </div>
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {lead.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300"
            >
              {tag}
            </span>
          ))}
          {lead.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{lead.tags.length - 2}</span>
          )}
        </div>
      )}
      <div className="text-xs text-gray-500">
        {formatDistanceToNow(lastAt, { addSuffix: true })}
      </div>
    </div>
  );
}
