import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ClipboardList,
  Pencil,
  Download,
  Trash2,
  FileText,
  X,
} from 'lucide-react';
import { Link } from 'react-router';
import type { DemoDocument, DocumentCategory } from '@/data/demoDocuments';
import CategoryBadge from './CategoryBadge';
import RawTextToggle from './RawTextToggle';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { formatDistanceToNow } from 'date-fns';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface MetadataField {
  label: string;
  value: string;
  confidence: 'high' | 'medium' | 'ai-inferred';
}

interface MetadataPanelProps {
  document: DemoDocument;
  onCategoryChange: (category: DocumentCategory) => void;
  onDelete: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function MetadataPanel({
  document: doc,
  onCategoryChange,
  onDelete,
  isMobile,
  onClose,
}: MetadataPanelProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const relativeDate = formatDistanceToNow(new Date(doc.uploadDate), {
    addSuffix: true,
  });

  // Build extracted fields from document data
  const fields: MetadataField[] = [
    {
      label: 'Document Type',
      value: getDocumentType(doc.category),
      confidence: 'high',
    },
    {
      label: 'Issuer / Provider',
      value: doc.entity,
      confidence: 'high',
    },
    {
      label: doc.category === 'Housing' ? 'Rent Amount' : doc.category === 'Employment' ? 'Net Pay' : 'Amount',
      value: doc.amount || 'N/A',
      confidence: 'high',
    },
    {
      label: doc.category === 'Housing' ? 'Lease Period' : doc.category === 'Employment' ? 'Pay Period' : 'Date',
      value: doc.date || 'N/A',
      confidence: 'medium',
    },
    {
      label: doc.category === 'Vehicle' ? 'VIN' : doc.category === 'Financial' ? 'Policy Number' : doc.category === 'Housing' ? 'Lease Number' : 'Reference',
      value: doc.policyRef || 'N/A',
      confidence: 'high',
    },
    {
      label: 'Uploaded',
      value: relativeDate,
      confidence: 'high',
    },
  ];

  // Add expiration date if available
  if (doc.expirationDate) {
    fields.splice(4, 0, {
      label: 'Expiration Date',
      value: doc.expirationDate,
      confidence: 'medium',
    });
  }

  const handleDownload = () => {
    const link = doc.thumbnail;
    const a = window.document.createElement('a');
    a.href = link;
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--maxwell-surface)' }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: easeOut, delay: 0.15 }}
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Header Row */}
        <div className="flex items-center gap-2 mb-5">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-medium transition-colors duration-fast hover:opacity-80"
            style={{ color: 'var(--maxwell-text-secondary)' }}
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </Link>
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="ml-auto flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-fast hover:bg-[var(--maxwell-border-subtle)]"
              style={{ color: 'var(--maxwell-text-secondary)' }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Document Name */}
        <h2
          className="font-semibold mb-4"
          style={{
            fontSize: '1.25rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            color: 'var(--maxwell-text-primary)',
          }}
          title={doc.name}
        >
          {doc.name}
        </h2>

        {/* Category Selector */}
        <div className="mb-5">
          <CategoryBadge
            category={doc.category}
            interactive
            onChange={onCategoryChange}
          />
        </div>

        {/* Extracted Fields */}
        <div className="mb-4">
          <h3
            className="flex items-center gap-2 font-semibold mb-3"
            style={{
              fontSize: '1rem',
              lineHeight: 1.4,
              color: 'var(--maxwell-text-primary)',
            }}
          >
            <ClipboardList size={16} style={{ color: 'var(--maxwell-text-secondary)' }} />
            Extracted Details
          </h3>

          <div
            className="rounded-lg border overflow-hidden"
            style={{
              borderColor: 'var(--maxwell-border-subtle)',
            }}
          >
            {fields.map((field, index) => (
              <motion.div
                key={field.label}
                className="relative flex items-start gap-3 px-4 py-3"
                style={{
                  borderBottom:
                    index < fields.length - 1
                      ? '1px solid var(--maxwell-border-subtle)'
                      : 'none',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: easeOut,
                  delay: 0.15 + index * 0.08,
                }}
                onMouseEnter={() => setHoveredField(field.label)}
                onMouseLeave={() => setHoveredField(null)}
              >
                {/* Label */}
                <span
                  className="flex-shrink-0 font-medium pt-0.5"
                  style={{
                    width: '140px',
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    letterSpacing: '0.01em',
                    color: 'var(--maxwell-text-tertiary)',
                  }}
                >
                  {field.label}
                </span>

                {/* Value with confidence dot */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span
                    className="text-sm"
                    style={{
                      lineHeight: 1.5,
                      color: 'var(--maxwell-text-primary)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {field.value}
                  </span>
                  <ConfidenceDot confidence={field.confidence} />

                  {/* Edit button on hover */}
                  {hoveredField === field.label && (
                    <motion.button
                      className="flex-shrink-0 ml-auto flex items-center justify-center w-6 h-6 rounded transition-colors duration-fast"
                      style={{ color: 'var(--maxwell-text-tertiary)' }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      title="Edit field"
                      aria-label={`Edit ${field.label}`}
                    >
                      <Pencil size={12} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Raw Text Toggle */}
        {doc.rawText && <RawTextToggle rawText={doc.rawText} />}

        {/* File Info */}
        {doc.fileSize && (
          <div
            className="flex items-center gap-2 mt-4 py-3"
            style={{
              borderTop: '1px solid var(--maxwell-border-subtle)',
              color: 'var(--maxwell-text-tertiary)',
            }}
          >
            <FileText size={14} />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>
              {doc.fileType?.toUpperCase() || 'FILE'} · {doc.fileSize}
            </span>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div
        className="flex-shrink-0 p-4 sm:p-6 border-t flex flex-col gap-2"
        style={{
          borderColor: 'var(--maxwell-border-subtle)',
          backgroundColor: 'var(--maxwell-surface)',
        }}
      >
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border font-semibold text-sm transition-all duration-fast hover:scale-[1.02] active:scale-[0.98]"
          style={{
            borderColor: 'var(--maxwell-primary)',
            color: 'var(--maxwell-primary)',
            backgroundColor: 'transparent',
          }}
        >
          <Download size={16} />
          Download original
        </button>

        <button
          onClick={() => setDeleteDialogOpen(true)}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-fast hover:scale-[1.02] active:scale-[0.98]"
          style={{
            color: 'var(--maxwell-danger)',
            backgroundColor: 'transparent',
          }}
        >
          <Trash2 size={16} />
          Delete document
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={onDelete}
      />
    </motion.div>
  );
}

// Helper: confidence dot component
function ConfidenceDot({ confidence }: { confidence: 'high' | 'medium' | 'ai-inferred' }) {
  const colorMap = {
    high: 'var(--maxwell-secondary)',
    medium: 'var(--maxwell-accent)',
    'ai-inferred': 'var(--maxwell-text-tertiary)',
  };

  const tooltipMap = {
    high: 'AI extracted this with high confidence',
    medium: 'AI extracted this with medium confidence',
    'ai-inferred': 'AI inferred this value',
  };

  return (
    <span
      className="inline-block flex-shrink-0 w-2 h-2 rounded-full"
      style={{ backgroundColor: colorMap[confidence] }}
      title={tooltipMap[confidence]}
    />
  );
}

// Helper: infer document type from category
function getDocumentType(category: DocumentCategory): string {
  const typeMap: Record<DocumentCategory, string> = {
    Housing: 'Lease Agreement',
    Medical: 'Medical Bill',
    Financial: 'Insurance Policy',
    Legal: 'Legal Document',
    Vehicle: 'Vehicle Registration',
    Employment: 'Pay Stub',
    General: 'Document',
  };
  return typeMap[category];
}
