// BriefingPanel — Daily Briefing Engine for Maxwell
// Surfaces upcoming deadlines, expiring documents, bills due, and action items
// AGPL v3 — Syntropy LLC

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/api';
import type { DocumentCategory, DocumentStatus } from '@/data/demoDocuments';

// ── Types ────────────────────────────────────────────────────────────────────

interface BriefingDoc {
  id: string;
  filename: string;
  original_name: string;
  category: DocumentCategory;
  document_type: string | null;
  status: DocumentStatus;
  entities: Record<string, string | number | undefined>;
  file_size: number;
  mime_type: string;
  created_at: number;
  expiration_date?: string;
  days_remaining?: number;
  amount?: string;
}

interface BriefingResponse {
  date: string;
  expiring_soon: BriefingDoc[];
  bills_due: BriefingDoc[];
  recent: BriefingDoc[];
  action_items: BriefingDoc[];
  total_count: number;
}

// ── Category Badge Colors ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  Housing: '#7c3aed',
  Medical: '#dc2626',
  Financial: '#059669',
  Legal: '#2563eb',
  Vehicle: '#d97706',
  Employment: '#0891b2',
  General: '#6b7280',
};

// ── Icons ────────────────────────────────────────────────────────────────────

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DollarSignIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronRightIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoOrTimestamp: string | number | undefined): string {
  if (!isoOrTimestamp) return 'No date';
  const date = typeof isoOrTimestamp === 'number'
    ? new Date(isoOrTimestamp * 1000)
    : new Date(isoOrTimestamp);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Animation ────────────────────────────────────────────────────────────────

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];
const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// ── Sub-Components ───────────────────────────────────────────────────────────

/**
 * Single briefing card — clickable, dismissible
 */
function BriefingCard({
  doc,
  index,
  accentColor,
  onClick,
  onDismiss,
  children,
}: {
  doc: BriefingDoc;
  index: number;
  accentColor: string;
  onClick: () => void;
  onDismiss: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3, ease: easeOut, delay: index * 0.05 }}
      className="relative group rounded-xl cursor-pointer transition-shadow duration-200 hover:shadow-md"
      style={{
        backgroundColor: 'var(--maxwell-surface)',
        boxShadow: 'var(--shadow-sm)',
        borderLeft: `3px solid ${accentColor}`,
      }}
      onClick={onClick}
    >
      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(doc.id);
        }}
        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-black/5"
        style={{ color: 'var(--maxwell-text-tertiary)' }}
        aria-label="Dismiss"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>

      <div className="p-3.5 pr-8">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Section header with icon and count
 */
function SectionHeader({
  icon,
  iconColor,
  title,
  count,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div
        className="flex items-center justify-center w-7 h-7 rounded-lg"
        style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
      >
        {icon}
      </div>
      <h3
        className="text-sm font-semibold flex-1"
        style={{ color: 'var(--maxwell-text-primary)' }}
      >
        {title}
      </h3>
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: `${iconColor}15`,
          color: iconColor,
        }}
      >
        {count}
      </span>
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: 'var(--maxwell-success-bg)', color: 'var(--maxwell-success)' }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p
        className="text-sm font-medium"
        style={{ color: 'var(--maxwell-text-secondary)' }}
      >
        All caught up!
      </p>
      <p
        className="text-xs mt-0.5"
        style={{ color: 'var(--maxwell-text-tertiary)' }}
      >
        No items requiring attention.
      </p>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function BriefingPanel() {
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // ── Fetch briefing on mount ────────────────────────────────────────────────
  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<BriefingResponse>('/briefing', { method: 'GET' });
      setBriefing(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load briefing';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBriefing();
  }, [fetchBriefing]);

  // ── Dismiss handler ────────────────────────────────────────────────────────
  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  // ── Retry handler for action items ─────────────────────────────────────────
  const handleRetry = useCallback((docId: string) => {
    // Navigate to document detail where retry can be triggered
    navigate(`/document/${docId}`);
  }, [navigate]);

  // ── Navigate to document detail ────────────────────────────────────────────
  const handleCardClick = useCallback((docId: string) => {
    navigate(`/document/${docId}`);
  }, [navigate]);

  // ── Filter out dismissed items ─────────────────────────────────────────────
  const expiringSoon = (briefing?.expiring_soon ?? []).filter((d) => !dismissedIds.has(d.id));
  const billsDue = (briefing?.bills_due ?? []).filter((d) => !dismissedIds.has(d.id));
  const recent = (briefing?.recent ?? []).filter((d) => !dismissedIds.has(d.id));
  const actionItems = (briefing?.action_items ?? []).filter((d) => !dismissedIds.has(d.id));

  const hasAnyItems = expiringSoon.length > 0 || billsDue.length > 0 || recent.length > 0 || actionItems.length > 0;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full max-w-container mx-auto px-4 sm:px-8 lg:px-10 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded" style={{ backgroundColor: 'var(--maxwell-border)', width: '40%' }} />
          <div className="h-4 rounded" style={{ backgroundColor: 'var(--maxwell-border-subtle)', width: '25%' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl"
                style={{ backgroundColor: 'var(--maxwell-surface)', boxShadow: 'var(--shadow-sm)' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full max-w-container mx-auto px-4 sm:px-8 lg:px-10 py-6">
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: 'var(--maxwell-error-bg)', color: 'var(--maxwell-error)' }}
        >
          <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={() => void fetchBriefing()}
            className="text-sm font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-container mx-auto px-4 sm:px-8 lg:px-10 py-6">
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeSmooth }}
      >
        <h1
          className="font-semibold"
          style={{
            fontSize: 'clamp(22px, 3vw, 28px)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--maxwell-text-primary)',
          }}
        >
          {greeting()}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--maxwell-text-tertiary)' }}
        >
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </motion.div>

      {/* Empty state */}
      {!hasAnyItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <EmptyState />
        </motion.div>
      )}

      {/* 2-column grid layout */}
      {hasAnyItems && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left Column: Expiring Soon + Bills Due ── */}
          <div className="space-y-6">
            {/* Expiring Soon */}
            {expiringSoon.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeSmooth, delay: 0.05 }}
              >
                <SectionHeader
                  icon={<AlertTriangleIcon className="w-4 h-4" />}
                  iconColor="#d97706"
                  title="Expiring Soon"
                  count={expiringSoon.length}
                />
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {expiringSoon.map((doc, i) => (
                      <BriefingCard
                        key={doc.id}
                        doc={doc}
                        index={i}
                        accentColor="#d97706"
                        onClick={() => handleCardClick(doc.id)}
                        onDismiss={handleDismiss}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: 'var(--maxwell-text-primary)' }}
                            >
                              {doc.original_name || doc.filename}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-xs"
                                style={{ color: '#d97706' }}
                              >
                                {doc.days_remaining !== undefined && doc.days_remaining <= 0
                                  ? 'Expired'
                                  : `${doc.days_remaining} day${doc.days_remaining !== 1 ? 's' : ''} remaining`}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: 'var(--maxwell-text-tertiary)' }}
                              >
                                {doc.expiration_date ? formatDate(doc.expiration_date) : ''}
                              </span>
                            </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--maxwell-text-tertiary)' }} />
                        </div>
                      </BriefingCard>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}

            {/* Bills Due */}
            {billsDue.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeSmooth, delay: 0.1 }}
              >
                <SectionHeader
                  icon={<DollarSignIcon className="w-4 h-4" />}
                  iconColor="#dc2626"
                  title="Bills Due"
                  count={billsDue.length}
                />
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {billsDue.map((doc, i) => (
                      <BriefingCard
                        key={doc.id}
                        doc={doc}
                        index={i}
                        accentColor="#dc2626"
                        onClick={() => handleCardClick(doc.id)}
                        onDismiss={handleDismiss}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: 'var(--maxwell-text-primary)' }}
                            >
                              {doc.original_name || doc.filename}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {doc.amount && (
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: '#dc2626' }}
                                >
                                  {doc.amount}
                                </span>
                              )}
                              {doc.expiration_date && (
                                <span
                                  className="text-xs"
                                  style={{ color: 'var(--maxwell-text-tertiary)' }}
                                >
                                  Due {formatDate(doc.expiration_date)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--maxwell-text-tertiary)' }} />
                        </div>
                      </BriefingCard>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </div>

          {/* ── Right Column: Recent Uploads + Action Items ── */}
          <div className="space-y-6">
            {/* Recent Uploads */}
            {recent.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeSmooth, delay: 0.15 }}
              >
                <SectionHeader
                  icon={<ClockIcon className="w-4 h-4" />}
                  iconColor="#2563eb"
                  title="Recent Uploads"
                  count={recent.length}
                />
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {recent.map((doc, i) => (
                      <BriefingCard
                        key={doc.id}
                        doc={doc}
                        index={i}
                        accentColor="#2563eb"
                        onClick={() => handleCardClick(doc.id)}
                        onDismiss={handleDismiss}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: 'var(--maxwell-text-primary)' }}
                            >
                              {doc.original_name || doc.filename}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                                style={{
                                  backgroundColor: `${CATEGORY_COLORS[doc.category]}15`,
                                  color: CATEGORY_COLORS[doc.category],
                                }}
                              >
                                {doc.category}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: 'var(--maxwell-text-tertiary)' }}
                              >
                                {formatDate(doc.created_at)}
                              </span>
                            </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--maxwell-text-tertiary)' }} />
                        </div>
                      </BriefingCard>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeSmooth, delay: 0.2 }}
              >
                <SectionHeader
                  icon={<ZapIcon className="w-4 h-4" />}
                  iconColor="#7c3aed"
                  title="Action Items"
                  count={actionItems.length}
                />
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {actionItems.map((doc, i) => (
                      <BriefingCard
                        key={doc.id}
                        doc={doc}
                        index={i}
                        accentColor="#7c3aed"
                        onClick={() => handleCardClick(doc.id)}
                        onDismiss={handleDismiss}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: 'var(--maxwell-text-primary)' }}
                            >
                              {doc.original_name || doc.filename}
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: 'var(--maxwell-text-tertiary)' }}
                            >
                              Parse failed — tap to retry
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(doc.id);
                            }}
                            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 hover:scale-[1.02]"
                            style={{
                              backgroundColor: '#7c3aed',
                              color: '#ffffff',
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      </BriefingCard>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
