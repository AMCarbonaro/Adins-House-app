import { useParams, Link } from 'react-router-dom';
import type { Room } from '../../lib/chat';

interface ChannelListProps {
  rooms: Room[];
  onlineCount: number | null;
}

export function ChannelList({ rooms, onlineCount }: ChannelListProps) {
  const { roomSlug } = useParams();

  return (
    <nav className="py-4" aria-label="Channels">
      <div className="px-4 flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Channels
        </h2>
        {onlineCount != null && (
          <span className="text-xs text-brand-400/80">{onlineCount} online</span>
        )}
      </div>
      <ul className="space-y-0.5">
        {rooms.map((room) => (
          <li key={room.id}>
            <Link
              to={`/dashboard/chat/${room.slug}`}
              className={`block px-4 py-2 text-sm rounded-r-lg transition ${
                roomSlug === room.slug
                  ? 'bg-brand-500/20 text-brand-300 border-l-2 border-brand-500'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
              }`}
            >
              <span className="text-gray-500">#</span> {room.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
