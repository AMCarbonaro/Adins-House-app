import { useParams, useOutletContext } from 'react-router-dom';
import { useRoomMessages, usePresence } from '../../hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Room } from '../../lib/chat';

interface OutletContext {
  rooms: Room[];
}

export function ChatRoom() {
  const { roomSlug } = useParams();
  const { rooms = [] } = (useOutletContext() as OutletContext) ?? {};
  const room = rooms.find((r) => r.slug === roomSlug);
  const { messages, loading, error, sendMessage, updateMessage, deleteMessage } =
    useRoomMessages(room?.id ?? null);
  const online = usePresence(room?.id ?? null);
  const onlineCount = Array.isArray(online) ? online.length : 0;

  if (!roomSlug) return null;
  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Channel not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-3 border-b border-white/5 bg-surface-900/30">
        <h1 className="text-lg font-semibold text-white">#{room.name}</h1>
        {room.description && (
          <p className="text-sm text-gray-500">{room.description}</p>
        )}
        <span className="text-xs text-brand-400/80">{onlineCount} online</span>
      </header>
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        onEdit={updateMessage}
        onDelete={deleteMessage}
      />
      <MessageInput
        onSend={(content) => sendMessage(content)}
        disabled={loading}
        placeholder={`Message #${room.name}`}
      />
    </div>
  );
}
