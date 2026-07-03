import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import SemanticSearchBar from '@/components/SemanticSearchBar';
import SearchResultGroup from '@/components/SearchResultGroup';
import DirectAnswerCard from '@/components/DirectAnswerCard';
import SearchEmptyState from '@/components/SearchEmptyState';
import SearchHistory from '@/components/SearchHistory';
import { searchDocuments } from '@/lib/api';
import type { DemoDocument, DocumentCategory } from '@/data/demoDocuments';
import type { SearchResult as ApiSearchResult } from '@/lib/api-types';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];

const CATEGORY_ORDER: DocumentCategory[] = [
  'Housing',
  'Medical',
  'Financial',
  'Legal',
  'Vehicle',
  'Employment',
  'General',
];

/* ─── localStorage helpers ─── */
const STORAGE_KEY = 'maxwell_search_history';

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToHistory(query: string): void {
  const history = getHistory();
  const trimmed = query.trim();
  if (!trimmed) return;
  const filtered = history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...filtered].slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

function removeFromHistory(query: string): void {
  const history = getHistory();
  const updated = history.filter((h) => h !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/* ─── Answer extraction ─── */
interface ExtractedAnswer {
  answer: string;
  document: DemoDocument;
}

function tryExtractAnswer(query: string, doc: DemoDocument): ExtractedAnswer | null {
  const q = query.toLowerCase().trim();
  if (!q.endsWith('?') && !q.startsWith('when') && !q.startsWith('what') && !q.startsWith('how') && !q.startsWith('who') && !q.startsWith('where') && !q.startsWith('which')) {
    return null;
  }

  // Vehicle registration expiration
  if ((q.includes('car') || q.includes('vehicle')) && q.includes('registration') && (q.includes('expire') || q.includes('when'))) {
    if (doc.category === 'Vehicle' && doc.expirationDate) {
      return { answer: `Your car registration expires on ${doc.expirationDate}.`, document: doc };
    }
  }

  // Rent query
  if ((q.includes('rent') || q.includes('monthly payment')) && doc.category === 'Housing' && doc.amount) {
    return { answer: `Your monthly rent is ${doc.amount}.`, document: doc };
  }

  // Medical bill amount
  if ((q.includes('medical') || q.includes('hospital') || q.includes('bill')) && q.includes('how much') && doc.category === 'Medical' && doc.amount) {
    return { answer: `Your medical bill from ${doc.entity} has ${doc.amount}.`, document: doc };
  }

  // Pay / salary
  if ((q.includes('salary') || q.includes('pay') || q.includes('income')) && doc.category === 'Employment' && doc.amount) {
    return { answer: `Your net pay is ${doc.amount} per pay period.`, document: doc };
  }

  // Insurance
  if ((q.includes('insurance') || q.includes('premium')) && doc.category === 'Financial' && doc.amount) {
    return { answer: `Your insurance premium is ${doc.amount}.`, document: doc };
  }

  // Generic expiration
  if ((q.includes('expire') || q.includes('when')) && doc.expirationDate) {
    return { answer: `Your ${doc.name.toLowerCase()} expires on ${doc.expirationDate}.`, document: doc };
  }

  // Generic amount
  if ((q.includes('how much') || q.includes('amount')) && doc.amount) {
    return { answer: `The amount for ${doc.name} is ${doc.amount}.`, document: doc };
  }

  return null;
}

/* ─── Adapters ─── */

/**
 * Convert a backend SearchResult to a frontend DemoDocument.
 * The snippet becomes rawText so SearchResultCard can highlight it.
 */
function adaptSearchResult(result: ApiSearchResult): DemoDocument {
  const entities = result.entities || {};

  return {
    id: result.id,
    name: result.original_name || result.filename,
    category: result.category,
    entity: entities.issuer || entities.recipient || entities.employer || '',
    amount: entities.amount_due || entities.rent_amount || entities.net_amount || entities.premium_amount || entities.gross_amount || undefined,
    date: entities.issue_date || entities.coverage_dates || entities.pay_period || entities.lease_start || undefined,
    policyRef: entities.account_number || entities.policy_number || undefined,
    status: (() => {
      switch (result.status) {
        case 'pending': return 'uploading' as const;
        case 'parsing': return 'parsing' as const;
        case 'completed': return 'complete' as const;
        case 'failed': return 'failed' as const;
        default: return 'complete' as const;
      }
    })(),
    thumbnail: '/og-image.png',
    uploadDate: new Date().toISOString(), // Search results don't include created_at
    expirationDate: entities.expiration_date || undefined,
    fileType: 'unsupported',
    fileSize: undefined,
    rawText: result.snippet, // Use the backend-provided snippet as rawText for highlighting
  };
}

/* ─── Loading skeleton ─── */
function SearchSkeleton() {
  return (
    <div className="w-full space-y-6 mt-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--maxwell-border)' }}
            />
            <div
              className="h-4 w-24 rounded animate-pulse"
              style={{ backgroundColor: 'var(--maxwell-border)' }}
            />
            <div
              className="h-5 w-8 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--maxwell-border-subtle)' }}
            />
          </div>
          <div
            className="h-16 rounded-lg animate-pulse"
            style={{ backgroundColor: 'var(--maxwell-border-subtle)' }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [results, setResults] = useState<DemoDocument[]>([]);
  const [groupedResults, setGroupedResults] = useState<Record<string, DemoDocument[]>>({});
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordedSearch = useRef(false);

  // Load search history
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Sync query from URL
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
    hasRecordedSearch.current = false;
  }, [searchParams]);

  // ── Perform real API search ────────────────────────────────────────────────
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    if (!q.trim()) {
      setResults([]);
      setGroupedResults({});
      setTotal(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function doSearch() {
      setIsLoading(true);
      setIsError(null);

      try {
        const response = await searchDocuments(q);
        if (!cancelled) {
          // Adapt API results to frontend DemoDocuments
          const adaptedResults = response.results.map(adaptSearchResult);
          setResults(adaptedResults);
          setTotal(response.total);

          // Adapt grouped results
          const adaptedGrouped: Record<string, DemoDocument[]> = {};
          for (const [cat, catResults] of Object.entries(response.grouped_by_category)) {
            adaptedGrouped[cat] = catResults.map(adaptSearchResult);
          }
          setGroupedResults(adaptedGrouped);

          // Record in history
          if (!hasRecordedSearch.current) {
            hasRecordedSearch.current = true;
            addToHistory(q);
            setHistory(getHistory());
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Search failed';
          setIsError(message);
          setResults([]);
          setGroupedResults({});
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    // Debounce slightly to avoid rapid-fire requests
    const timeout = setTimeout(() => {
      void doSearch();
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchParams]);

  // ── Category order filtering ───────────────────────────────────────────────
  const visibleCategories = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => groupedResults[cat] && groupedResults[cat].length > 0);
  }, [groupedResults]);

  // ── Try extract answer from top result ─────────────────────────────────────
  const directAnswer = useMemo(() => {
    if (!query.trim() || results.length === 0) return null;
    return tryExtractAnswer(query, results[0]);
  }, [query, results]);

  // ── Debounced search handler ───────────────────────────────────────────────
  const handleSearch = useCallback(
    (newQuery: string) => {
      setIsLoading(true);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        if (newQuery.trim()) {
          setSearchParams({ q: newQuery.trim() });
        } else {
          setSearchParams({});
        }
      }, 300);
    },
    [setSearchParams]
  );

  const handleHistorySearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      setSearchParams({ q: searchQuery });
    },
    [setSearchParams]
  );

  const handleClearHistoryItem = useCallback((item: string) => {
    removeFromHistory(item);
    setHistory(getHistory());
  }, []);

  const handleClearAllHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setSearchParams({ q: suggestion });
    },
    [setSearchParams]
  );

  const hasResults = results.length > 0;
  const showEmptyState = !isLoading && query.trim() && !hasResults && !isError;
  const showResults = !isLoading && hasResults;

  return (
    <motion.div
      className="w-full px-4 sm:px-6 lg:px-8 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
    >
      <div className="max-w-[680px] mx-auto">
        {/* Persistent Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
        >
          <SemanticSearchBar onSearch={handleSearch} initialQuery={initialQuery} />
        </motion.div>

        {/* Search History */}
        <SearchHistory
          searches={history}
          onSearchClick={handleHistorySearch}
          onClearSearch={handleClearHistoryItem}
          onClearAll={handleClearAllHistory}
        />

        {/* Error State */}
        <AnimatePresence>
          {isError && (
            <motion.div
              key="error"
              className="flex flex-col items-center mt-8 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p style={{ fontSize: '14px', color: 'var(--maxwell-danger)' }}>
                {isError}
              </p>
              <button
                onClick={() => setSearchParams({ q: query })}
                className="px-4 py-2 rounded-lg font-medium text-sm"
                style={{
                  backgroundColor: 'var(--maxwell-primary)',
                  color: '#FFFFFF',
                }}
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Meta */}
        {showResults && (
          <motion.div
            className="flex items-center gap-2 mt-5 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Search size={14} style={{ color: 'var(--maxwell-text-tertiary)' }} />
            <span style={{ fontSize: '12px', color: 'var(--maxwell-text-tertiary)', fontWeight: 500 }}>
              {total} document{total !== 1 ? 's' : ''} found
            </span>
          </motion.div>
        )}

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-2 mt-5 mb-2">
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--maxwell-text-tertiary)' }} />
                <span style={{ fontSize: '12px', color: 'var(--maxwell-text-tertiary)', fontWeight: 500 }}>
                  Searching&hellip;
                </span>
              </div>
              <SearchSkeleton />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Direct Answer Card */}
        <AnimatePresence>
          {showResults && directAnswer && (
            <DirectAnswerCard
              answer={directAnswer.answer}
              sourceDocument={directAnswer.document}
            />
          )}
        </AnimatePresence>

        {/* Results Grouped by Category */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 1 }}
              animate={{ opacity: isLoading ? 0.3 : 1 }}
              transition={{ duration: 0.15 }}
            >
              {visibleCategories.map((category, idx) => (
                <SearchResultGroup
                  key={category}
                  category={category}
                  documents={groupedResults[category]}
                  groupIndex={idx}
                  query={query}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        <AnimatePresence>
          {showEmptyState && (
            <SearchEmptyState
              query={query}
              onSuggestionClick={handleSuggestionClick}
            />
          )}
        </AnimatePresence>

        {/* No query state */}
        {!query.trim() && !isLoading && (
          <motion.div
            className="flex flex-col items-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p
              style={{
                fontSize: '14px',
                color: 'var(--maxwell-text-tertiary)',
                textAlign: 'center',
              }}
            >
              Enter a search query above to find your documents.
            </p>
            <p
              className="mt-2"
              style={{
                fontSize: '13px',
                color: 'var(--maxwell-text-tertiary)',
                textAlign: 'center',
              }}
            >
              Try asking about dates, amounts, or document contents.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
