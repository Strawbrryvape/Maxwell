import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DocumentCategory } from '@/data/demoDocuments';
import { CATEGORIES } from '@/data/demoDocuments';
import {
  Home, HeartPulse, DollarSign, Scale, Car, Briefcase, Folder
} from 'lucide-react';

const categoryColors: Record<DocumentCategory, { bg: string; text: string; border: string }> = {
  Housing: { bg: 'var(--category-housing-bg)', text: 'var(--category-housing-text)', border: 'var(--category-housing-border)' },
  Medical: { bg: 'var(--category-medical-bg)', text: 'var(--category-medical-text)', border: 'var(--category-medical-border)' },
  Financial: { bg: 'var(--category-financial-bg)', text: 'var(--category-financial-text)', border: 'var(--category-financial-border)' },
  Legal: { bg: 'var(--category-legal-bg)', text: 'var(--category-legal-text)', border: 'var(--category-legal-border)' },
  Vehicle: { bg: 'var(--category-vehicle-bg)', text: 'var(--category-vehicle-text)', border: 'var(--category-vehicle-border)' },
  Employment: { bg: 'var(--category-employment-bg)', text: 'var(--category-employment-text)', border: 'var(--category-employment-border)' },
  General: { bg: 'var(--category-general-bg)', text: 'var(--category-general-text)', border: 'var(--category-general-border)' },
};

const iconMap = {
  Home,
  HeartPulse,
  DollarSign,
  Scale,
  Car,
  Briefcase,
  Folder,
};

interface CategoryBadgeProps {
  category: DocumentCategory;
  interactive?: boolean;
  onChange?: (category: DocumentCategory) => void;
}

export default function CategoryBadge({ category, interactive = false, onChange }: CategoryBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = categoryColors[category];

  const handleSelect = useCallback((cat: DocumentCategory) => {
    onChange?.(cat);
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <motion.button
        onClick={() => interactive && setOpen(!open)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          fontSize: '11px',
          letterSpacing: '0.02em',
          border: `1px solid ${colors.border}`,
          cursor: interactive ? 'pointer' : 'default',
        }}
        whileHover={interactive ? { scale: 1.05 } : {}}
        transition={{ duration: 0.15 }}
      >
        {category}
      </motion.button>

      {/* Dropdown for correction */}
      <AnimatePresence>
        {open && interactive && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute z-50 mt-1 py-1 rounded-lg shadow-xl border"
              style={{
                backgroundColor: 'var(--maxwell-surface)',
                borderColor: 'var(--maxwell-border)',
                minWidth: '160px',
              }}
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {CATEGORIES.map((cat) => {
                const Icon = iconMap[cat.icon as keyof typeof iconMap];
                const catColors = categoryColors[cat.label];
                return (
                  <button
                    key={cat.label}
                    onClick={() => handleSelect(cat.label)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-[var(--maxwell-primary-light)]"
                    style={{
                      color: catColors.text,
                      fontSize: '13px',
                    }}
                  >
                    <Icon size={14} />
                    <span className="text-[var(--maxwell-text-secondary)]">{cat.label}</span>
                    {cat.label === category && (
                      <span className="ml-auto text-[10px] font-semibold" style={{ color: 'var(--maxwell-primary)' }}>
                        active
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
