import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { SearchX, Upload } from 'lucide-react';

const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];
const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface SearchEmptyStateProps {
  query: string;
  onSuggestionClick?: (suggestion: string) => void;
}

const categorySuggestions = ['Medical', 'Vehicle', 'Housing', 'Financial'];

const querySuggestions: Record<string, string[]> = {
  medical: ['Show all medical bills', 'When was my last doctor visit?', 'What are my medical charges?'],
  vehicle: ['When does my car registration expire?', 'What is my license plate number?', 'Vehicle registration fees'],
  housing: ['When is my lease up?', 'What is my monthly rent?', 'Show my lease agreement'],
  financial: ['Show my insurance policy', 'What are my premium payments?', 'Recent financial documents'],
};

const SearchEmptyState = memo(function SearchEmptyState({ query, onSuggestionClick }: SearchEmptyStateProps) {
  const navigate = useNavigate();

  // Pick suggestions based on query keywords or default to generic
  const lowerQuery = query.toLowerCase();
  let suggestions: string[] = ['Show all medical bills', 'When is my lease up?', 'Recent documents'];

  for (const [key, vals] of Object.entries(querySuggestions)) {
    if (lowerQuery.includes(key)) {
      suggestions = vals.slice(0, 3);
      break;
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center text-center py-16"
      style={{ maxWidth: '440px', margin: '0 auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeOut }}
    >
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: easeSpring }}
      >
        <SearchX
          size={48}
          style={{ color: 'var(--maxwell-text-tertiary)' }}
          strokeWidth={1.5}
        />
      </motion.div>

      {/* Title */}
      <motion.h2
        className="mt-4 font-semibold"
        style={{
          fontSize: '18px',
          lineHeight: '1.4',
          color: 'var(--maxwell-text-primary)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut, delay: 0.08 }}
      >
        No matches found
      </motion.h2>

      {/* Body */}
      <motion.p
        className="mt-2"
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'var(--maxwell-text-secondary)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut, delay: 0.16 }}
      >
        Maxwell couldn&apos;t find anything matching that query. Try rephrasing or check if the document has been uploaded.
      </motion.p>

      {/* Category filter chips */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut, delay: 0.24 }}
      >
        <p
          className="mb-3 font-medium"
          style={{
            fontSize: '12px',
            color: 'var(--maxwell-text-tertiary)',
          }}
        >
          Try filtering by category:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {categorySuggestions.map((cat, idx) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: easeSpring, delay: 0.3 + idx * 0.06 }}
              onClick={() => onSuggestionClick?.(cat)}
              className="px-4 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105"
              style={{
                fontSize: '13px',
                backgroundColor: 'var(--maxwell-primary-light)',
                color: 'var(--maxwell-primary)',
                border: '1px solid var(--maxwell-border)',
              }}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Query suggestions */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut, delay: 0.32 }}
      >
        <p
          className="mb-3 font-medium"
          style={{
            fontSize: '12px',
            color: 'var(--maxwell-text-tertiary)',
          }}
        >
          Try asking:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((s, idx) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: easeSpring, delay: 0.38 + idx * 0.06 }}
              onClick={() => onSuggestionClick?.(s)}
              className="px-4 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105"
              style={{
                fontSize: '13px',
                backgroundColor: 'var(--maxwell-surface)',
                color: 'var(--maxwell-text-secondary)',
                border: '1px solid var(--maxwell-border)',
              }}
            >
              {s}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Upload button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut, delay: 0.48 }}
        onClick={() => navigate('/')}
        className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          fontSize: '14px',
          backgroundColor: 'var(--maxwell-primary)',
          color: '#fff',
        }}
      >
        <Upload size={16} />
        <span>Upload a document</span>
      </motion.button>
    </motion.div>
  );
});

export default SearchEmptyState;
