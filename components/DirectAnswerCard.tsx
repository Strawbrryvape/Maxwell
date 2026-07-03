import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { DemoDocument } from '@/data/demoDocuments';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface DirectAnswerCardProps {
  answer: string;
  sourceDocument: DemoDocument;
}

const DirectAnswerCard = memo(function DirectAnswerCard({ answer, sourceDocument }: DirectAnswerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut, delay: 0.15 }}
      className="w-full mb-6"
      style={{
        backgroundColor: 'var(--maxwell-primary-light)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        borderLeft: '4px solid var(--maxwell-primary)',
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={14} style={{ color: 'var(--maxwell-primary)' }} />
        <span
          className="font-semibold"
          style={{
            fontSize: '12px',
            color: 'var(--maxwell-primary)',
          }}
        >
          Direct Answer
        </span>
      </div>

      {/* Answer text */}
      <p
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'var(--maxwell-text-primary)',
        }}
      >
        {answer}
      </p>

      {/* Source link */}
      <Link
        to={`/document/${sourceDocument.id}`}
        className="group inline-flex items-center gap-1 mt-3 font-medium transition-transform duration-200 hover:translate-x-1"
        style={{
          fontSize: '13px',
          color: 'var(--maxwell-primary)',
        }}
      >
        <span>From: {sourceDocument.name}</span>
        <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
});

export default DirectAnswerCard;
