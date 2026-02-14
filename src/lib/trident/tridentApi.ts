import { supabase } from '../supabase';
import { parseLeadFromDatabase } from './leadHelpers';
import { updateLeadCalculations } from './businessLogic';
import type { Lead } from './leadHelpers';

function serializeLeadForDb(leadPayload: Record<string, unknown>): Record<string, unknown> {
  const data = { ...leadPayload };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  const eng = data.engagement as { lastActivityAt?: Date } | undefined;
  if (eng?.lastActivityAt) {
    (data.engagement as Record<string, unknown>).lastActivityAt =
      eng.lastActivityAt instanceof Date
        ? eng.lastActivityAt.toISOString()
        : eng.lastActivityAt;
  }
  if (data.lastContactAt)
    data.lastContactAt =
      data.lastContactAt instanceof Date
        ? (data.lastContactAt as Date).toISOString()
        : data.lastContactAt;
  const notes = data.notes as Array<{ createdAt: Date }> | undefined;
  if (notes) {
    data.notes = notes.map((n) => ({
      ...n,
      createdAt:
        n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
    }));
  }
  const offers = (data.monetization as { offers?: Array<{ createdAt: Date }> })?.offers;
  if (offers) {
    ((data.monetization as Record<string, unknown>) ?? {}).offers = offers.map(
      (o) => ({
        ...o,
        createdAt:
          o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
      })
    );
  }
  const payments = (data.monetization as { payments?: Array<{ receivedAt: Date }> })?.payments;
  if (payments) {
    ((data.monetization as Record<string, unknown>) ?? {}).payments = payments.map(
      (p) => ({
        ...p,
        receivedAt:
          p.receivedAt instanceof Date ? p.receivedAt.toISOString() : p.receivedAt,
      })
    );
  }
  const reminders = data.reminders as Array<{ dueAt: Date; completedAt?: Date }> | undefined;
  if (reminders) {
    data.reminders = reminders.map((r) => ({
      ...r,
      dueAt: r.dueAt instanceof Date ? r.dueAt.toISOString() : r.dueAt,
      completedAt: r.completedAt
        ? r.completedAt instanceof Date
          ? r.completedAt.toISOString()
          : r.completedAt
        : undefined,
    }));
  }
  return data;
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data: rows, error } = await supabase
    .from('crm_leads')
    .select('id, data, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch leads');
  return (rows || []).map((row) => parseLeadFromDatabase(row));
}

export async function createLead(leadInput: Record<string, unknown>): Promise<Lead> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const now = new Date();
  const calculated = updateLeadCalculations({
    ...leadInput,
    id: '',
    createdAt: now,
    updatedAt: now,
    engagement: {
      ...(leadInput.engagement as object),
      lastActivityAt:
        (leadInput.engagement as { lastActivityAt?: Date })?.lastActivityAt instanceof
        Date
          ? (leadInput.engagement as { lastActivityAt: Date }).lastActivityAt
          : new Date(
              (leadInput.engagement as { lastActivityAt: string })?.lastActivityAt
            ),
    },
    notes: ((leadInput.notes as Array<{ createdAt: Date }>) || []).map((n) => ({
      ...n,
      createdAt: n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt as string),
    })),
    monetization: {
      ...(leadInput.monetization as object),
      offers: (
        (leadInput.monetization as { offers?: Array<{ createdAt: Date }> })?.offers ||
        []
      ).map((o) => ({
        ...o,
        createdAt:
          o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt as string),
      })),
      payments: (
        (leadInput.monetization as { payments?: Array<{ receivedAt: Date }> })?.payments ||
        []
      ).map((p) => ({
        ...p,
        receivedAt:
          p.receivedAt instanceof Date ? p.receivedAt : new Date(p.receivedAt as string),
      })),
    },
    reminders: ((leadInput.reminders as Array<{ dueAt: Date }>) || []).map(
      (r) => ({
        ...r,
        dueAt: r.dueAt instanceof Date ? r.dueAt : new Date(r.dueAt as string),
      })
    ),
  } as Lead);

  const payload = serializeLeadForDb(calculated as unknown as Record<string, unknown>);
  const { data: row, error } = await supabase
    .from('crm_leads')
    .insert({ user_id: user.id, data: payload })
    .select('id, data, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message || 'Failed to create lead');
  return parseLeadFromDatabase(row);
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const { data: existing, error: fetchError } = await supabase
    .from('crm_leads')
    .select('id, data, created_at, updated_at')
    .eq('id', id)
    .single();

  if (fetchError || !existing) throw new Error('Lead not found');

  const current = parseLeadFromDatabase(existing);
  const merged: Lead = {
    ...current,
    ...updates,
    id,
    updatedAt: new Date(),
    engagement: {
      ...current.engagement,
      ...(updates.engagement || {}),
    },
    monetization: {
      ...current.monetization,
      ...(updates.monetization || {}),
    },
  };
  if (updates.engagement?.lastActivityAt) {
    merged.engagement!.lastActivityAt =
      updates.engagement.lastActivityAt instanceof Date
        ? updates.engagement.lastActivityAt
        : new Date(updates.engagement.lastActivityAt as string);
  }
  if (updates.notes) merged.notes = updates.notes;
  if (updates.lastContactAt)
    merged.lastContactAt =
      updates.lastContactAt instanceof Date
        ? updates.lastContactAt
        : new Date(updates.lastContactAt as string);

  const calculated = updateLeadCalculations(merged);
  const payload = serializeLeadForDb(calculated as unknown as Record<string, unknown>);

  const { data: row, error } = await supabase
    .from('crm_leads')
    .update({ data: payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, data, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message || 'Failed to update lead');
  return parseLeadFromDatabase(row);
}

export async function moveLead(id: string, newStage: string): Promise<Lead> {
  return updateLead(id, { stage: newStage });
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('crm_leads').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete lead');
}
