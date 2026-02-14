import { useState, useEffect, useCallback } from 'react';
import {
  fetchRooms,
  fetchMessages,
  sendMessage as sendMessageApi,
  updateMessage as updateMessageApi,
  deleteMessage as deleteMessageApi,
  ensureProfile,
  subscribeToRoomMessages,
  subscribeToPresence,
  type Message,
  type Room,
} from '../lib/chat';

function normalizeMessage(m: Message & { profiles?: unknown }): Message {
  return {
    id: m.id,
    room_id: m.room_id,
    user_id: m.user_id,
    content: m.content,
    created_at: m.created_at,
    updated_at: m.updated_at,
    display_name: m.display_name ?? null,
  };
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRooms()
      .then((data) => {
        if (!cancelled) setRooms(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rooms, loading, error };
}

export function useRoomMessages(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMessages(roomId)
      .then((data) => {
        if (!cancelled) setMessages(data ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToRoomMessages(roomId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.new!.id)) return prev;
          return [...prev, { ...payload.new!, display_name: payload.new!.display_name ?? null }];
        });
      }
      if (payload.eventType === 'UPDATE' && payload.new) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.new!.id ? { ...payload.new!, display_name: payload.new!.display_name ?? null } : m
          )
        );
      }
      if (payload.eventType === 'DELETE' && payload.old) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old!.id));
      }
    });
    return unsub;
  }, [roomId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!roomId) return;
      const sent = await sendMessageApi(roomId, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, normalizeMessage(sent)];
      });
      return sent;
    },
    [roomId]
  );

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    await updateMessageApi(messageId, content);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content, updated_at: new Date().toISOString() } : m
      )
    );
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    await deleteMessageApi(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  return { messages, loading, error, sendMessage, updateMessage, deleteMessage };
}

export function usePresence(roomId: string | null) {
  const [online, setOnline] = useState<{ user_id?: string; email?: string }[]>([]);

  useEffect(() => {
    if (!roomId) {
      setOnline([]);
      return;
    }
    const unsub = subscribeToPresence(roomId, setOnline);
    return unsub;
  }, [roomId]);

  return online;
}

export function useEnsureProfile() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    ensureProfile()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);
  return ready;
}
