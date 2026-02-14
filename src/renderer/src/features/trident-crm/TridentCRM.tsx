import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useLeadStore } from '../../stores/leadStore';
import { DEFAULT_STAGES } from '../../lib/trident/constants';
import { StageColumn } from './StageColumn';
import { LeadCard } from './LeadCard';
import { AddLeadModal } from './AddLeadModal';
import { LeadDetailPanel } from './LeadDetailPanel';

export function TridentCRM() {
  const { leads, fetchLeads, moveLead, setSelectedLeadId, isLoading, error } =
    useLeadStore();
  const [detailOpen, setDetailOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [addLeadStage, setAddLeadStage] = useState<string | undefined>(
    undefined
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const selectedLeadId = useLeadStore((s) => s.selectedLeadId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, typeof leads> = {};
    DEFAULT_STAGES.forEach((s) => {
      grouped[s] = [];
    });
    leads.forEach((lead) => {
      const stage = DEFAULT_STAGES.includes(lead.stage as typeof DEFAULT_STAGES[number])
        ? lead.stage
        : DEFAULT_STAGES[0];
      grouped[stage].push(lead);
    });
    return grouped;
  }, [leads]);

  const handleDragStart = (event: { active: { id: string } }) =>
    setActiveId(event.active.id);
  const handleDragEnd = (event: {
    active: { id: string };
    over: { id: string } | null;
  }) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const leadId = active.id;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    if (
      DEFAULT_STAGES.includes(over.id as typeof DEFAULT_STAGES[number]) &&
      over.id !== lead.stage
    ) {
      moveLead(leadId, over.id).catch((err) =>
        console.error('Move lead failed', err)
      );
    }
  };

  const openDetail = (leadId: string) => {
    setSelectedLeadId(leadId);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedLeadId(null);
  };

  const openAddModal = (stage?: string) => {
    setAddLeadStage(stage);
    setModalOpen(true);
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-white/5">
        <h1 className="text-xl font-semibold text-white">Trident CRM</h1>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium"
          onClick={() => openAddModal()}
        >
          Add Lead
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      {isLoading && leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading leads…
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-4 min-w-max">
              {DEFAULT_STAGES.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  leads={leadsByStage[stage] || []}
                  onAddLead={() => openAddModal(stage)}
                  onCardClick={openDetail}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeLead ? (
              <div style={{ opacity: 0.85 }}>
                <LeadCard
                  lead={activeLead}
                  onClick={() => {}}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <AddLeadModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAddLeadStage(undefined);
        }}
        defaultStage={addLeadStage}
      />

      {detailOpen && selectedLeadId && (
        <LeadDetailPanel leadId={selectedLeadId} onClose={closeDetail} />
      )}
    </div>
  );
}
