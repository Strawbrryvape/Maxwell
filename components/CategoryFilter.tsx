import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DocumentCategory } from '@/data/demoDocuments';
import { CATEGORIES } from '@/data/demoDocuments';
import {
  LayoutList, Home, HeartPulse, DollarSign, Scale, Car, Briefcase, Folder
} from 'lucide-react';

const iconMap = {
  LayoutList,
  Home,
  HeartPulse,
  DollarSign,
  Scale,
  Car,
  Briefcase,
  Folder,
};

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const categoryIconColors: Record<string, string> = {
  'All Documents': 'var(--maxwell-text-secondary)',
  'Housing': 'var(--category-housing-text)',
  'Medical': 'var(--category-medical-text)',
  'Financial': 'var(--category-financial-text)',
  'Legal': 'var(--category-legal-text)',
  'Vehicle': 'var(--category-vehicle-text)',
  'Employment': 'var(--category-employment-text)',
  'General': 'var(--category-general-text)',
};

interface CategoryFilterProps {
  selected: DocumentCategory | 'All';
  onSelect: (category: DocumentCategory | 'All') => void;
  counts: Record<string, number>;
}

const CategoryFilter = memo(function CategoryFilter({ selected, onSelect, counts }: CategoryFilterProps) {
  const allCategories = [{ label: 'All Documents' as const, icon: 'LayoutList' }, ...CATEGORIES.map(c => ({ label: c.label, icon: c.icon }))];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:block sticky top-20 w-[200px] flex-shrink-0"
        style={{ top: '80px' }}
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: easeOut, delay: 0.3 }}
      >
        <div
          className="p-4 space-y-1"
          style={{
            backgroundColor: 'var(--maxwell-surface)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {allCategories.map((cat) => {
            const Icon = iconMap[cat.icon as keyof typeof iconMap];
            const isActive = selected === cat.label || (selected === 'All' && cat.label === 'All Documents');
            const label = cat.label === 'All Documents' ? 'All' : cat.label;
            const count = cat.label === 'All Documents' ? counts['All'] || 0 : counts[cat.label] || 0;

            return (
              <button
                key={cat.label}
                onClick={() => onSelect(label as DocumentCategory | 'All')}
                className="flex items-center w-full gap-2 px-3 py-2 rounded-lg transition-all duration-fast text-left"
                style={{
                  backgroundColor: isActive ? 'var(--maxwell-primary-light)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--maxwell-primary)' : '3px solid transparent',
                }}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? 'var(--maxwell-primary)' : categoryIconColors[cat.label] }}
                />
                <span
                  className="flex-1 text-sm"
                  style={{
                    color: isActive ? 'var(--maxwell-primary)' : 'var(--maxwell-text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {cat.label}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--maxwell-text-tertiary)' }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.aside>

      {/* Mobile Horizontal Chips */}
      <motion.div
        className="lg:hidden w-full overflow-x-auto hide-scrollbar px-4 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex gap-2" style={{ scrollSnapType: 'x mandatory' }}>
          {allCategories.map((cat, i) => {
            const isActive = selected === cat.label || (selected === 'All' && cat.label === 'All Documents');
            const label = cat.label === 'All Documents' ? 'All' : cat.label;

            return (
              <motion.button
                key={cat.label}
                onClick={() => onSelect(label as DocumentCategory | 'All')}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full font-medium text-sm transition-all duration-fast whitespace-nowrap"
                style={{
                  backgroundColor: isActive ? 'var(--maxwell-primary)' : 'var(--maxwell-border-subtle)',
                  color: isActive ? '#FFFFFF' : 'var(--maxwell-text-secondary)',
                  scrollSnapAlign: 'start',
                }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
});

export default CategoryFilter;
