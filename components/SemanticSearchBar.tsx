import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface SemanticSearchBarProps {
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

export default function SemanticSearchBar({ onSearch, initialQuery = '' }: SemanticSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external query changes (e.g., URL updates, history chips)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      onSearch?.(val);
    }, 400);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setIsLoading(false);
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, navigate]);

  return (
    <motion.div
      className="w-full flex flex-col items-center"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut, delay: 0.15 }}
    >
      <form onSubmit={handleSubmit} className="w-full" style={{ maxWidth: '680px' }}>
        <div
          className="relative flex items-center w-full transition-all duration-200"
          style={{
            height: '52px',
            backgroundColor: 'var(--maxwell-surface)',
            borderRadius: '16px',
            border: isFocused
              ? '1.5px solid var(--maxwell-primary)'
              : '1.5px solid var(--maxwell-border)',
            boxShadow: isFocused ? 'var(--shadow-upload)' : 'none',
          }}
        >
          {/* Search icon */}
          <div className="pl-4 flex-shrink-0" style={{ color: 'var(--maxwell-text-tertiary)' }}>
            {isLoading && query ? (
              <Loader2 size={20} className="animate-spinner" />
            ) : (
              <Search size={20} />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Maxwell anything..."
            className="flex-1 bg-transparent outline-none px-3"
            style={{
              color: 'var(--maxwell-text-primary)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '1.5',
            }}
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="pr-4 flex-shrink-0 transition-colors hover:text-[var(--maxwell-text-primary)]"
              style={{ color: 'var(--maxwell-text-tertiary)' }}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </form>

      {/* Examples */}
      <p
        className="mt-3 text-center italic"
        style={{
          fontSize: '12px',
          color: 'var(--maxwell-text-tertiary)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Try: &ldquo;When does my car registration expire?&rdquo; or &ldquo;What was my rent in March?&rdquo;
      </p>
    </motion.div>
  );
}
