interface DbRow {
  id: string;
  data: unknown;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  text: string;
  createdAt: Date;
}

export interface Lead {
  id: string;
  displayName: string;
  stage: string;
  platforms?: {
    instagram?: { username: string };
    snapchat?: { username: string };
  };
  tags?: string[];
  notes?: LeadNote[];
  engagement?: {
    replySpeed?: number;
    activityLevel?: string;
    lastActivityAt?: Date;
    engagementScore?: number;
  };
  monetization?: {
    totalRevenue?: number;
    offers?: unknown[];
    payments?: unknown[];
  };
  createdAt: Date;
  updatedAt: Date;
  lastContactAt?: Date;
  reminders?: unknown[];
  priority?: string;
  isHighValue?: boolean;
  isDormant?: boolean;
  metadata?: Record<string, unknown>;
}

export function parseLeadFromDatabase(row: DbRow): Lead {
  const data =
    typeof row.data === 'string' ? JSON.parse(row.data) : (row.data as Record<string, unknown>);
  const lead = { ...data, id: row.id } as Lead;
  lead.createdAt = new Date(row.created_at);
  lead.updatedAt = new Date(row.updated_at);
  if (lead.engagement?.lastActivityAt) {
    lead.engagement.lastActivityAt = new Date(
      lead.engagement.lastActivityAt as string | Date
    );
  }
  if (lead.lastContactAt)
    lead.lastContactAt = new Date(lead.lastContactAt as string | Date);
  if (lead.notes) {
    lead.notes = lead.notes.map((n) => ({
      ...(n as LeadNote),
      createdAt: new Date((n as LeadNote).createdAt as string | Date),
    }));
  }
  if (lead.monetization?.offers) {
    lead.monetization.offers = lead.monetization.offers.map((o) => ({
      ...(o as Record<string, unknown>),
      createdAt: new Date((o as { createdAt: string }).createdAt),
    }));
  }
  if (lead.monetization?.payments) {
    lead.monetization.payments = lead.monetization.payments.map((p) => ({
      ...(p as Record<string, unknown>),
      receivedAt: new Date((p as { receivedAt: string }).receivedAt),
    }));
  }
  if (lead.reminders) {
    lead.reminders = lead.reminders.map((r) => {
      const rem = r as { dueAt: string; completedAt?: string };
      return {
        ...rem,
        dueAt: new Date(rem.dueAt),
        completedAt: rem.completedAt ? new Date(rem.completedAt) : undefined,
      };
    });
  }
  return lead;
}
