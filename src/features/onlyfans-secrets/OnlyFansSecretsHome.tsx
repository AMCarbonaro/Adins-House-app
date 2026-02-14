import { Link } from 'react-router-dom';
import {
  ONLYFANS_SECRETS_INTRO,
  ONLYFANS_SECRETS_CHAPTERS,
} from '../../content/onlyFansSecretsChapters';

export function OnlyFansSecretsHome() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-white mb-2">
        {ONLYFANS_SECRETS_INTRO.title}
      </h1>
      <p className="text-brand-400/80 mb-2">{ONLYFANS_SECRETS_INTRO.byline}</p>
      <p className="text-gray-400 mb-8">{ONLYFANS_SECRETS_INTRO.subtitle}</p>
      <p className="text-gray-300 mb-8">
        Select a chapter from the sidebar to start reading, or pick one below:
      </p>
      <ul className="space-y-3">
        {ONLYFANS_SECRETS_CHAPTERS.map((ch) => (
          <li key={ch.id}>
            <Link
              to={`/dashboard/onlyfans-secrets/chapters/${ch.id}`}
              className="block p-4 rounded-lg bg-surface-800/50 border border-white/5 hover:border-brand-500/30 hover:bg-surface-800 transition"
            >
              <span className="text-brand-400/80 text-sm">
                Chapter {ch.number}
              </span>
              <h3 className="font-semibold text-white mt-1">{ch.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{ch.subtitle}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
