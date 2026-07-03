import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface SearchHistoryProps {
  searches: string[];
  onSearchClick: (query: string) => void;
  onClearSearch: (query: string) => void;
  onClearAll: () => void;
}

const SearchHistory = memo(function SearchHistory({
  searches,
  onSearchClick,
  onClearSearch,
  onClearAll,
}: SearchHistoryProps) {
  if (searches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: easeOut, delay: 0.1 }}
      className="w-full mt-3"
      style={{ maxWidth: '680px', margin: '12px auto 0' }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
          <Clock size={12} />
          <span style={{ fontSize: '12px', fontWeight: 500 }}>Recent:</span>
        </div>

        {searches.map((search, idx) => (
          <motion.button
            key={search}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, ease: easeOut, delay: idx * 0.03 }}
            onClick={() => onSearchClick(search)}
            className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-150 hover:scale-105"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: 'var(--maxwell-border-subtle)',
              color: 'var(--maxwell-text-secondary)',
              border: '1px solid var(--maxwell-border)',
            }}
          >
            <span>{search}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onClearSearch(search);
              }}
              className="inline-flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-[var(--maxwell-border)]"
              style={{ padding: '1px' }}
            >
              <X size={10} />
            </span>
          </motion.button>
        ))}

        <button
          onClick={onClearAll}
          className="ml-1 font-medium transition-colors duration-150 hover:text-[var(--maxwell-text-secondary)]"
          style={{
            fontSize: '11px',
            color: 'var(--maxwell-text-tertiary)',
          }}
        >
          Clear all
        </button>
      </div>
    </motion.div>
  );
});

export default SearchHistory;
