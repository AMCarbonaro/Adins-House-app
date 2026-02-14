import { create } from 'zustand';
import * as tridentApi from '../lib/trident/tridentApi';
import type { Lead } from '../lib/trident/leadHelpers';

function migrateNotes(
  notes: unknown
): Array<{ id: string; text: string; createdAt: Date }> {
  if (Array.isArray(notes)) {
    return notes.map((n) =>
      typeof n === 'string'
        ? {
            id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            text: n,
            createdAt: new Date(),
          }
        : {
            ...(n as { id: string; text: string; createdAt: Date }),
            createdAt:
              (n as { createdAt: Date }).createdAt instanceof Date
                ? (n as { createdAt: Date }).createdAt
                : new Date((n as { createdAt: string }).createdAt),
          }
    );
  }
  if (typeof notes === 'string' && notes.trim()) {
    return [
      {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        text: notes.trim(),
        createdAt: new Date(),
      },
    ];
  }
  return [];
}

interface LeadStore {
  leads: Lead[];
  selectedLeadId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  addLead: (leadInput: Record<string, unknown>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<Lead>;
  moveLead: (id: string, newStage: string) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  getLeadById: (id: string) => Lead | undefined;
  setSelectedLeadId: (id: string | null) => void;
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  selectedLeadId: null,
  isLoading: false,
  error: null,

  fetchLeads: async () => {
    set({ isLoading: true, error: null });
    try {
      const leads = await tridentApi.fetchLeads();
      set({ leads, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch leads',
        isLoading: false,
      });
    }
  },

  addLead: async (leadInput) => {
    const input = { ...leadInput, notes: migrateNotes(leadInput.notes ?? []) };
    set({ isLoading: true, error: null });
    try {
      const newLead = await tridentApi.createLead(input);
      set((state) => ({ leads: [newLead, ...state.leads], isLoading: false }));
      return newLead;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create lead',
        isLoading: false,
      });
      throw err;
    }
  },

  updateLead: async (id, updates) => {
    const migrated = updates.notes
      ? { ...updates, notes: migrateNotes(updates.notes) }
      : updates;
    set({ isLoading: true, error: null });
    try {
      const updated = await tridentApi.updateLead(id, migrated);
      set((state) => ({
        leads: state.leads.map((l) => (l.id === id ? updated : l)),
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update lead',
        isLoading: false,
      });
      throw err;
    }
  },

  moveLead: async (id, newStage) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await tridentApi.moveLead(id, newStage);
      set((state) => ({
        leads: state.leads.map((l) => (l.id === id ? updated : l)),
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to move lead',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteLead: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await tridentApi.deleteLead(id);
      set((state) => ({
        leads: state.leads.filter((l) => l.id !== id),
        selectedLeadId: state.selectedLeadId === id ? null : state.selectedLeadId,
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete lead',
        isLoading: false,
      });
      throw err;
    }
  },

  getLeadById: (id) => get().leads.find((l) => l.id === id),
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
}));
