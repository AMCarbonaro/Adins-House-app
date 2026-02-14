import { FUNNEL_STAGES } from './constants';
import type { Lead } from './leadHelpers';

function calculateEngagementScore(lead: Lead): number {
  let score = 50;
  const eng = lead.engagement ?? {};
  if (eng.replySpeed != null) {
    if (eng.replySpeed < 2) score += 20;
    else if (eng.replySpeed < 6) score += 10;
    else if (eng.replySpeed > 24) score -= 15;
  }
  if (eng.activityLevel === 'high') score += 15;
  else if (eng.activityLevel === 'low') score -= 10;

  const stageWeights: Record<string, number> = {
    [FUNNEL_STAGES.INSTAGRAM_FOLLOWED]: 0,
    [FUNNEL_STAGES.INSTAGRAM_FOLLOWED_BACK]: 3,
    [FUNNEL_STAGES.INSTAGRAM_DM_SENT]: 6,
    [FUNNEL_STAGES.ENGAGED_IN_DM_CONVERSATION]: 10,
    [FUNNEL_STAGES.ASKED_FOR_THE_SNAP]: 12,
    [FUNNEL_STAGES.SNAPCHAT_ADDED]: 15,
    [FUNNEL_STAGES.SNAPCHAT_ADDED_BACK]: 18,
    [FUNNEL_STAGES.INITIAL_SNAP_SENT_RECEIVED]: 20,
    [FUNNEL_STAGES.SNAPCHAT_CONVERSATION]: 22,
    [FUNNEL_STAGES.HEATED_SNAPCHAT_CONVERSATION]: 28,
    [FUNNEL_STAGES.THE_ASK]: 30,
    [FUNNEL_STAGES.ASK_DELIVERED]: 32,
    [FUNNEL_STAGES.PAID]: 35,
    [FUNNEL_STAGES.RETURNING_CUSTOMER]: 30,
    [FUNNEL_STAGES.SATISFIED_CUSTOMER]: 20,
    [FUNNEL_STAGES.DORMANT]: -25,
  };
  score += stageWeights[lead.stage] ?? 0;

  const lastAt = eng.lastActivityAt
    ? eng.lastActivityAt instanceof Date
      ? eng.lastActivityAt
      : new Date(eng.lastActivityAt as string)
    : new Date();
  const daysSince = (Date.now() - lastAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 1) score += 10;
  else if (daysSince > 7) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function calculatePriority(lead: Lead): string {
  if (lead.isHighValue) return 'high';
  if (
    lead.stage === FUNNEL_STAGES.THE_ASK ||
    lead.stage === FUNNEL_STAGES.ASK_DELIVERED ||
    lead.stage === FUNNEL_STAGES.HEATED_SNAPCHAT_CONVERSATION ||
    lead.stage === FUNNEL_STAGES.PAID
  )
    return 'high';
  if ((lead.engagement?.engagementScore ?? 0) > 70) return 'high';
  if (lead.stage === FUNNEL_STAGES.DORMANT) return 'low';
  if ((lead.engagement?.engagementScore ?? 0) < 30) return 'low';
  return 'medium';
}

function isHighValue(lead: Lead): boolean {
  return (
    (lead.monetization?.totalRevenue ?? 0) > 500 ||
    (lead.engagement?.engagementScore ?? 0) > 75
  );
}

function shouldBeDormant(lead: Lead): boolean {
  const lastAt = lead.engagement?.lastActivityAt
    ? lead.engagement.lastActivityAt instanceof Date
      ? lead.engagement.lastActivityAt
      : new Date(lead.engagement.lastActivityAt as string)
    : new Date();
  const daysSince = (Date.now() - lastAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 14 && lead.stage !== FUNNEL_STAGES.DORMANT;
}

export function updateLeadCalculations(lead: Lead): Lead {
  const updated = { ...lead };
  const score = calculateEngagementScore(updated);
  updated.engagement = {
    ...updated.engagement,
    engagementScore: score,
  };
  updated.priority = calculatePriority(updated);
  updated.isHighValue = isHighValue(updated);
  updated.isDormant = shouldBeDormant(updated);
  return updated;
}
