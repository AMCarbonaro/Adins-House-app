import { supabase } from './supabase';

export interface Room {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  display_name: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export async function fetchRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMessages(
  roomId: string,
  options: { limit?: number; before?: string | null } = {}
): Promise<Message[]> {
  const { limit = 50, before = null } = options;
  let q = supabase
    .from('messages')
    .select(
      `
      id,
      room_id,
      user_id,
      content,
      created_at,
      updated_at,
      profiles ( display_name )
    `,
      { count: 'exact' }
    )
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (before) {
    q = q.lt('created_at', before);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(normalizeMessage);
}

function normalizeMessage(m: {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string | null } | { display_name: string | null }[];
}): Message {
  const profile = m.profiles
    ? Array.isArray(m.profiles)
      ? m.profiles[0]
      : m.profiles
    : null;
  return {
    id: m.id,
    room_id: m.room_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
    updated_at: m.updated_at,
    display_name: profile?.display_name ?? null,
  };
}

export async function sendMessage(roomId: string, content: string): Promise<Message> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: user.id,
      content: content.trim(),
    })
    .select(
      `
      id,
      room_id,
      user_id,
      content,
      created_at,
      updated_at,
      profiles ( display_name )
    `
    )
    .single();
  if (error) throw error;
  return normalizeMessage(data);
}

export async function updateMessage(messageId: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .update({ content: content.trim() })
    .eq('id', messageId)
    .select('id, room_id, user_id, content, created_at, updated_at, profiles(display_name)')
    .single();
  if (error) throw error;
  return normalizeMessage(data as Parameters<typeof normalizeMessage>[0]);
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) throw error;
}

export async function getProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, updated_at')
    .eq('id', user.id)
    .single();
  if (error) return null;
  return data;
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function ensureProfile(displayName?: string | null): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) {
    if (displayName !== null && displayName !== undefined) {
      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }
    return user.id;
  }
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    display_name:
      displayName ??
      (user.user_metadata as { full_name?: string; name?: string })?.full_name ??
      (user.user_metadata as { full_name?: string; name?: string })?.name ??
      user.email?.split('@')[0] ??
      null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return user.id;
}

export function subscribeToRoomMessages(
  roomId: string,
  callback: (payload: {
    eventType: string;
    new?: Message;
    old?: { id: string };
  }) => void
): () => void {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
        event: '*',
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new ? normalizeMessage(payload.new as Parameters<typeof normalizeMessage>[0]) : undefined,
          old: payload.old as { id: string } | undefined,
        });
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface PresenceUser {
  user_id?: string;
  email?: string;
}

export function subscribeToPresence(
  roomId: string,
  onSync: (users: PresenceUser[]) => void
): () => void {
  const channel = supabase.channel(`presence:${roomId}`);
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const all = Object.values(state).flat() as PresenceUser[];
      const byUser = new Map<string, PresenceUser>();
      all.forEach((p) =>
        byUser.set((p.user_id ?? p.email) as string, p)
      );
      onSync(Array.from(byUser.values()));
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) await channel.track({ user_id: user.id, email: user.email });
      }
    });
  return () => supabase.removeChannel(channel);
}
