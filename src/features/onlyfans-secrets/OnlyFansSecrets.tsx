import { Outlet, Link, useParams } from 'react-router-dom';
import {
  ONLYFANS_SECRETS_INTRO,
  ONLYFANS_SECRETS_CHAPTERS,
} from '../../content/onlyFansSecretsChapters';

export function OnlyFansSecrets() {
  const { chapterId } = useParams();

  return (
    <div className="flex h-full">
      <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-surface-900/30 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">
            {ONLYFANS_SECRETS_INTRO.title}
          </h2>
          <p className="text-sm text-brand-400/80 mt-1">
            {ONLYFANS_SECRETS_INTRO.byline}
          </p>
        </div>
        <nav aria-label="Chapters">
          <ul className="space-y-1">
            {ONLYFANS_SECRETS_CHAPTERS.map((ch) => (
              <li key={ch.id}>
                <Link
                  to={`/dashboard/onlyfans-secrets/chapters/${ch.id}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition ${
                    chapterId === ch.id
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <span className="text-gray-500 mr-2">
                    {String(ch.number).padStart(2, '0')}
                  </span>
                  {ch.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
