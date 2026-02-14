import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LeadCard } from './LeadCard';
import type { Lead } from '../../lib/trident/leadHelpers';

interface SortableLeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function SortableLeadCard({ lead, onClick }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}
