import { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageItem } from './MessageItem';
import type { Message } from '../../lib/chat';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

export function MessageList({
  messages,
  loading,
  error,
  onEdit,
  onDelete,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Loading messages…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>No messages yet. Say something!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <ul className="space-y-1">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isOwn={user?.id === msg.user_id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
