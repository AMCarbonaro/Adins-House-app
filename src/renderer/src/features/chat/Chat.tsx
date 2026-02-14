import { useParams, Outlet, useOutletContext } from 'react-router-dom';
import { useRooms, useEnsureProfile, usePresence } from '../../hooks/useChat';
import { ChannelList } from './ChannelList';
import { ChatWelcome } from './ChatWelcome';

function ChatContent() {
  const { roomSlug } = useParams();
  useEnsureProfile();
  const { rooms, loading: roomsLoading, error: roomsError } = useRooms();
  const currentRoom = rooms.find((r) => r.slug === roomSlug);
  const online = usePresence(currentRoom?.id ?? null);
  const onlineCount = Array.isArray(online) ? online.length : 0;

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading channels…</p>
      </div>
    );
  }

  if (roomsError) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        <p>{roomsError}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <aside className="w-52 flex-shrink-0 border-r border-white/5 bg-surface-900/30">
        <ChannelList rooms={rooms} onlineCount={roomSlug ? onlineCount : null} />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet context={{ rooms }} />
      </div>
    </div>
  );
}

export function ChatIndex() {
  const ctx = useOutletContext<{ rooms: import('../../lib/chat').Room[] } | undefined>();
  return <ChatWelcome rooms={ctx?.rooms ?? []} />;
}

export function Chat() {
  return (
    <div className="h-full flex flex-col">
      <ChatContent />
    </div>
  );
}
