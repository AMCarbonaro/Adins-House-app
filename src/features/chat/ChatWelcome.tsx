import { Link } from 'react-router-dom';
import type { Room } from '../../lib/chat';

interface ChatWelcomeProps {
  rooms: Room[];
}

export function ChatWelcome({ rooms }: ChatWelcomeProps) {
  const first = rooms[0];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-2xl font-bold text-white mb-2">Community Chat</h2>
      <p className="text-gray-400 mb-6">Pick a channel to start talking.</p>
      <ul className="space-y-2 mb-8">
        {rooms.map((room) => (
          <li key={room.id}>
            <Link
              to={`/dashboard/chat/${room.slug}`}
              className="text-brand-400 hover:text-brand-300 transition"
            >
              # {room.name}
            </Link>
            {room.description && (
              <span className="text-gray-500 text-sm ml-2">— {room.description}</span>
            )}
          </li>
        ))}
      </ul>
      {first && (
        <Link
          to={`/dashboard/chat/${first.slug}`}
          className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition"
        >
          Open # {first.name}
        </Link>
      )}
    </div>
  );
}
