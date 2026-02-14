import { useParams, Link } from 'react-router-dom';
import { ONLYFANS_SECRETS_CHAPTERS } from '../../content/onlyFansSecretsChapters';
import type { ChapterBlock } from '../../content/onlyFansSecretsChapters';

function ChapterBlockRender({ block }: { block: ChapterBlock }) {
  if (block.type === 'p')
    return <p className="text-gray-300 leading-relaxed mb-4">{block.text}</p>;
  if (block.type === 'h3')
    return (
      <h3 className="text-lg font-semibold text-white mt-8 mb-3">
        {block.text}
      </h3>
    );
  if (block.type === 'blockquote')
    return (
      <blockquote className="border-l-4 border-brand-500 pl-4 py-2 my-4 text-brand-300 italic">
        {block.text}
      </blockquote>
    );
  if (block.type === 'ul')
    return (
      <ul className="list-disc list-inside space-y-2 mb-4 text-gray-300">
        {block.items?.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  return null;
}

export function OnlyFansSecretsChapter() {
  const { chapterId } = useParams();
  const chapter = ONLYFANS_SECRETS_CHAPTERS.find((c) => c.id === chapterId);
  const index = chapter
    ? ONLYFANS_SECRETS_CHAPTERS.findIndex((c) => c.id === chapterId)
    : -1;
  const prev =
    index > 0 ? ONLYFANS_SECRETS_CHAPTERS[index - 1] ?? null : null;
  const next =
    index >= 0 && index < ONLYFANS_SECRETS_CHAPTERS.length - 1
      ? ONLYFANS_SECRETS_CHAPTERS[index + 1] ?? null
      : null;
  const pct = chapter ? Math.round((chapter.number / 7) * 100) : 0;

  if (!chapter) {
    return (
      <div className="p-8 text-gray-500">
        <p>Chapter not found.</p>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto p-8">
      <p className="text-sm text-brand-400/80 mb-2">
        Chapter {chapter.number} of 7 · {pct}% Complete
      </p>
      <h1 className="text-2xl font-bold text-white mb-2">{chapter.title}</h1>
      <p className="text-gray-500 mb-8">{chapter.subtitle}</p>
      <div className="prose prose-invert max-w-none">
        {chapter.blocks.map((block, i) => (
          <ChapterBlockRender key={i} block={block} />
        ))}
      </div>
      <section className="mt-10 pt-8 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">
          Key Takeaways
        </h3>
        <ul className="space-y-2 text-gray-300">
          {chapter.takeaways.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-brand-400">✓</span> {t}
            </li>
          ))}
        </ul>
      </section>
      <nav
        className="mt-10 pt-8 border-t border-white/10 flex justify-between"
        aria-label="Chapter navigation"
      >
        {prev ? (
          <Link
            to={`/dashboard/onlyfans-secrets/chapters/${prev.id}`}
            className="text-brand-400 hover:text-brand-300 text-sm"
          >
            ← Previous: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/dashboard/onlyfans-secrets/chapters/${next.id}`}
            className="text-brand-400 hover:text-brand-300 text-sm"
          >
            Next: {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
