import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { STAGE_LABELS } from '../../lib/trident/constants';
import { SortableLeadCard } from './SortableLeadCard';
import type { Lead } from '../../lib/trident/leadHelpers';

interface StageColumnProps {
  stage: string;
  leads: Lead[];
  onAddLead: () => void;
  onCardClick: (leadId: string) => void;
}

export function StageColumn({
  stage,
  leads,
  onAddLead,
  onCardClick,
}: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const label = STAGE_LABELS[stage] || stage;

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-52 rounded-lg bg-surface-800/50 border transition ${
        isOver ? 'border-brand-500/50' : 'border-white/5'
      }`}
      role="region"
      aria-label={`${label}, ${leads.length} leads`}
    >
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <h3 className="font-medium text-white text-sm truncate">{label}</h3>
        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
          {leads.length}
        </span>
        <button
          type="button"
          className="p-1 rounded text-gray-500 hover:text-brand-400 hover:bg-white/5"
          onClick={(e) => {
            e.stopPropagation();
            onAddLead();
          }}
          aria-label={`Add lead to ${label}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      <div className="p-2 min-h-[100px] space-y-2">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm">
            <span>No leads</span>
            <button
              type="button"
              className="mt-2 text-brand-400 hover:text-brand-300"
              onClick={onAddLead}
            >
              Add Lead
            </button>
          </div>
        ) : (
          <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {leads.map((lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onCardClick(lead.id)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
