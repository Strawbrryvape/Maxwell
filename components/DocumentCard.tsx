import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Calendar, Clock } from 'lucide-react';
import type { DemoDocument } from '@/data/demoDocuments';
import CategoryBadge from './CategoryBadge';
import ParsingProgress from './ParsingProgress';
import { formatDistanceToNow } from 'date-fns';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface DocumentCardProps {
  document: DemoDocument;
  index: number;
  onCategoryChange?: (id: string, category: DemoDocument['category']) => void;
}

const DocumentCard = memo(function DocumentCard({ document, index, onCategoryChange }: DocumentCardProps) {
  const relativeDate = formatDistanceToNow(new Date(document.uploadDate), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOut, delay: index * 0.06 }}
    >
      <Link to={`/document/${document.id}`} className="block group">
        <motion.div
          className="relative overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: 'var(--maxwell-surface)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
          }}
          whileHover={{
            y: -2,
            boxShadow: 'var(--shadow-lg)',
          }}
          transition={{ duration: 0.2, ease: easeOut }}
        >
          {/* Thumbnail */}
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: '16/10',
              backgroundColor: 'var(--maxwell-border-subtle)',
            }}
          >
            <img
              src={document.thumbnail}
              alt={document.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />

            {/* Parsing overlay */}
            {document.status !== 'complete' && (
              <ParsingProgress status={document.status} fileName={document.name} />
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Document name */}
            <h3
              className="font-semibold truncate"
              style={{
                fontSize: '14px',
                lineHeight: '1.4',
                color: 'var(--maxwell-text-primary)',
              }}
            >
              {document.name}
            </h3>

            {/* Category badge */}
            <div className="mt-2">
              <CategoryBadge
                category={document.category}
                interactive
                onChange={(cat) => onCategoryChange?.(document.id, cat)}
              />
            </div>

            {/* Dates */}
            <div className="mt-2 flex items-center gap-3">
              {document.expirationDate && (
                <span className="flex items-center gap-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                  <Calendar size={12} />
                  <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>
                    {document.expirationDate}
                  </span>
                </span>
              )}
              <span className="flex items-center gap-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                <Clock size={12} />
                <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.01em' }}>
                  {relativeDate}
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
});

export default DocumentCard;
