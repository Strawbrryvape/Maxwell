import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { DemoDocument, DocumentCategory } from '@/data/demoDocuments';
import { CATEGORIES } from '@/data/demoDocuments';
import SearchResultCard from './SearchResultCard';
import {
  Home, HeartPulse, DollarSign, Scale, Car, Briefcase, Folder
} from 'lucide-react';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];

const categoryColors: Record<DocumentCategory, { text: string }> = {
  Housing: { text: 'var(--category-housing-text)' },
  Medical: { text: 'var(--category-medical-text)' },
  Financial: { text: 'var(--category-financial-text)' },
  Legal: { text: 'var(--category-legal-text)' },
  Vehicle: { text: 'var(--category-vehicle-text)' },
  Employment: { text: 'var(--category-employment-text)' },
  General: { text: 'var(--category-general-text)' },
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

interface SearchResultGroupProps {
  category: DocumentCategory;
  documents: DemoDocument[];
  groupIndex: number;
  query: string;
}

export default function SearchResultGroup({ category, documents, groupIndex, query }: SearchResultGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const colors = categoryColors[category];
  const categoryMeta = CATEGORIES.find((c) => c.label === category);
  const Icon = categoryMeta ? iconMap[categoryMeta.icon as keyof typeof iconMap] : Folder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOut, delay: groupIndex * 0.08 }}
      style={{ borderBottom: '1px solid var(--maxwell-border)' }}
    >
      {/* Category header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full py-4 group/header"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: colors.text }} />
          <span
            className="font-semibold"
            style={{
              fontSize: '14px',
              color: 'var(--maxwell-text-primary)',
            }}
          >
            {category}
          </span>
          <span
            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-semibold"
            style={{
              fontSize: '11px',
              backgroundColor: 'var(--maxwell-border-subtle)',
              color: 'var(--maxwell-text-secondary)',
              minWidth: '24px',
            }}
          >
            {documents.length}
          </span>
        </div>

        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.2, ease: easeSmooth }}
          style={{ color: 'var(--maxwell-text-tertiary)' }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {/* Collapsible results */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              {documents.map((doc, idx) => (
                <SearchResultCard
                  key={doc.id}
                  document={doc}
                  index={idx}
                  query={query}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
