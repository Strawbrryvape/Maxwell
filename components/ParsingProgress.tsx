import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { DocumentStatus } from '@/data/demoDocuments';

interface ParsingProgressProps {
  status: DocumentStatus;
  fileName?: string;
}

const statusConfig: Record<DocumentStatus, { text: string; icon: React.ReactNode }> = {
  uploading: {
    text: 'Uploading...',
    icon: <Loader2 size={20} className="animate-spinner" style={{ color: 'var(--maxwell-primary)' }} />,
  },
  parsing: {
    text: 'Reading your document...',
    icon: null,
  },
  extracting: {
    text: 'Almost there...',
    icon: null,
  },
  complete: {
    text: 'Complete!',
    icon: <CheckCircle size={20} style={{ color: 'var(--maxwell-secondary)' }} />,
  },
  failed: {
    text: 'Could not read this one. You can still save it — just pick a category.',
    icon: <AlertCircle size={20} style={{ color: 'var(--maxwell-danger)' }} />,
  },
};

const ParsingProgress = memo(function ParsingProgress({ status, fileName }: ParsingProgressProps) {
  const config = statusConfig[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        style={{
          backgroundColor:
            status === 'failed'
              ? 'rgba(254,242,242,0.85)'
              : 'rgba(255,255,255,0.85)',
          padding: '16px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Scan line animation for parsing state */}
        {status === 'parsing' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/2 left-0 right-0 h-[2px] animate-scan-sweep"
              style={{ backgroundColor: 'var(--maxwell-primary)' }}
            />
          </div>
        )}

        {/* Status icon */}
        {config.icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {config.icon}
          </motion.div>
        )}

        {/* Extracting dots animation */}
        {status === 'extracting' && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--maxwell-primary)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}

        {/* Status text */}
        <motion.p
          className="text-center font-medium z-10"
          style={{
            fontSize: '13px',
            color:
              status === 'failed'
                ? 'var(--maxwell-danger)'
                : 'var(--maxwell-text-secondary)',
            lineHeight: '1.4',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {config.text}
        </motion.p>

        {/* File name */}
        {fileName && status !== 'complete' && status !== 'failed' && (
          <p
            className="text-center truncate max-w-full z-10"
            style={{
              fontSize: '11px',
              color: 'var(--maxwell-text-tertiary)',
            }}
          >
            {fileName}
          </p>
        )}

        {/* Progress bar for uploading */}
        {status === 'uploading' && (
          <div
            className="w-full max-w-[120px] h-1 rounded-full overflow-hidden z-10"
            style={{ backgroundColor: 'var(--maxwell-border)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--maxwell-primary)' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'linear' }}
            />
          </div>
        )}

        {/* Failed state actions */}
        {status === 'failed' && (
          <div className="flex items-center gap-2 z-10 mt-1">
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--maxwell-primary)' }}
            >
              Retry
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                color: 'var(--maxwell-text-secondary)',
                backgroundColor: 'var(--maxwell-border-subtle)',
              }}
            >
              Pick category
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

export default ParsingProgress;
