import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { DemoDocument } from '@/data/demoDocuments';
import CategoryBadge from './CategoryBadge';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface SearchResultCardProps {
  document: DemoDocument;
  index: number;
  query: string;
}

function getSnippet(rawText: string, query: string): { text: string; matchIndex: number; matchLength: number } {
  const lowerText = rawText.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) {
    return { text: rawText.slice(0, 140) + (rawText.length > 140 ? '...' : ''), matchIndex: -1, matchLength: 0 };
  }

  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) {
    // Try matching individual words
    const words = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
    for (const word of words) {
      const widx = lowerText.indexOf(word);
      if (widx !== -1) {
        const start = Math.max(0, widx - 50);
        const end = Math.min(rawText.length, widx + word.length + 50);
        return {
          text: (start > 0 ? '...' : '') + rawText.slice(start, end) + (end < rawText.length ? '...' : ''),
          matchIndex: start > 0 ? widx - start + 3 : widx - start,
          matchLength: word.length,
        };
      }
    }
    return { text: rawText.slice(0, 140) + (rawText.length > 140 ? '...' : ''), matchIndex: -1, matchLength: 0 };
  }

  const start = Math.max(0, idx - 50);
  const end = Math.min(rawText.length, idx + lowerQuery.length + 50);
  return {
    text: (start > 0 ? '...' : '') + rawText.slice(start, end) + (end < rawText.length ? '...' : ''),
    matchIndex: start > 0 ? idx - start + 3 : idx - start,
    matchLength: lowerQuery.length,
  };
}

function highlightText(snippet: { text: string; matchIndex: number; matchLength: number }, query: string) {
  if (snippet.matchIndex === -1 || !query.trim()) {
    return <span>{snippet.text}</span>;
  }

  const before = snippet.text.slice(0, snippet.matchIndex);
  const match = snippet.text.slice(snippet.matchIndex, snippet.matchIndex + snippet.matchLength);
  const after = snippet.text.slice(snippet.matchIndex + snippet.matchLength);

  return (
    <span>
      {before}
      <mark
        className="rounded px-0.5"
        style={{
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          color: 'var(--maxwell-primary)',
        }}
      >
        {match}
      </mark>
      {after}
    </span>
  );
}

function highlightTitle(name: string, query: string) {
  if (!query.trim()) return <span>{name}</span>;

  const lowerName = name.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const idx = lowerName.indexOf(lowerQuery);

  if (idx === -1) {
    // Try word matching
    const words = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) return <span>{name}</span>;

    let result: React.ReactNode[] = [<span key="init">{name}</span>];
    for (const word of words) {
      const widx = name.toLowerCase().indexOf(word);
      if (widx !== -1) {
        result = [
          <span key="before">{name.slice(0, widx)}</span>,
          <mark
            key="match"
            className="rounded px-0.5"
            style={{
              backgroundColor: 'rgba(79, 70, 229, 0.15)',
              color: 'var(--maxwell-primary)',
            }}
          >
            {name.slice(widx, widx + word.length)}
          </mark>,
          <span key="after">{name.slice(widx + word.length)}</span>,
        ];
        break;
      }
    }
    return <span>{result}</span>;
  }

  return (
    <span>
      {name.slice(0, idx)}
      <mark
        className="rounded px-0.5"
        style={{
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          color: 'var(--maxwell-primary)',
        }}
      >
        {name.slice(idx, idx + lowerQuery.length)}
      </mark>
      {name.slice(idx + lowerQuery.length)}
    </span>
  );
}

const SearchResultCard = memo(function SearchResultCard({ document, index, query }: SearchResultCardProps) {
  const snippet = getSnippet(document.rawText ?? '', query);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: easeOut, delay: index * 0.04 }}
    >
      <Link
        to={`/document/${document.id}`}
        className="group block p-4 rounded-lg transition-colors duration-200"
        style={{
          borderRadius: 'var(--radius-lg)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(238, 242, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Document name with highlight */}
            <h3
              className="font-semibold truncate transition-transform duration-200 group-hover:translate-x-0.5"
              style={{
                fontSize: '14px',
                lineHeight: '1.4',
                color: 'var(--maxwell-text-primary)',
              }}
            >
              {highlightTitle(document.name, query)}
            </h3>

            {/* Snippet */}
            <p
              className="mt-1 line-clamp-2"
              style={{
                fontSize: '13px',
                lineHeight: '1.5',
                color: 'var(--maxwell-text-secondary)',
              }}
            >
              &ldquo;{highlightText(snippet, query)}&rdquo;
            </p>

            {/* View link */}
            <div
              className="mt-2 inline-flex items-center gap-1 font-medium transition-transform duration-200 group-hover:translate-x-1"
              style={{
                fontSize: '13px',
                color: 'var(--maxwell-primary)',
              }}
            >
              <span>View</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Category badge */}
          <div className="flex-shrink-0 mt-0.5">
            <CategoryBadge category={document.category} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

export default SearchResultCard;
