// Maxwell Audit Trail — V1.5.1
// Activity Ledger refactored into a full audit trail with anomaly banner,
// document timeline, confidence badges, and enhanced filtering.

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  Upload,
  FileText,
  Search,
  Download,
  List,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type AuditEntry,
  type AuditCategory,
  type ConfidenceThreshold,
  demoActivity,
  AUDIT_CATEGORIES,
  CONFIDENCE_OPTIONS,
} from '@/data/demoActivity';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];
const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// ── Utility: relative time string ────────────────────────────────────────────
function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Confidence Badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence === undefined) return null;

  if (confidence >= 0.9) {
    return (
      <Badge
        className="text-[11px] font-semibold border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      >
        <CheckCircle2 className="w-3 h-3 mr-0.5" />
        {Math.round(confidence * 100)}%
      </Badge>
    );
  }
  if (confidence >= 0.7) {
    return (
      <Badge
        className="text-[11px] font-semibold border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100"
      >
        <Clock className="w-3 h-3 mr-0.5" />
        {Math.round(confidence * 100)}%
      </Badge>
    );
  }
  return (
    <Badge
      className="text-[11px] font-semibold border-transparent bg-red-100 text-red-700 hover:bg-red-100"
    >
      <ShieldAlert className="w-3 h-3 mr-0.5" />
      Needs Review
    </Badge>
  );
}

// ── Status Icon for entries ─────────────────────────────────────────────────
function StatusIcon({ status }: { status: AuditEntry['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'warning':
      return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'error':
      return <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />;
    case 'alert':
      return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-slate-400 shrink-0" />;
    default:
      return null;
  }
}

// ── Action Icon ──────────────────────────────────────────────────────────────
function ActionIcon({ action }: { action: AuditEntry['action'] }) {
  switch (action) {
    case 'upload':
      return <Upload className="w-4 h-4" />;
    case 'parse':
      return <FileText className="w-4 h-4" />;
    case 'search':
      return <Search className="w-4 h-4" />;
    case 'export':
      return <Download className="w-4 h-4" />;
    case 'anomaly':
      return <AlertTriangle className="w-4 h-4" />;
    case 'insights_generated':
      return <Eye className="w-4 h-4" />;
    case 'category_correction':
      return <FileText className="w-4 h-4" />;
    default:
      return <List className="w-4 h-4" />;
  }
}

// ── Timeline Dialog ──────────────────────────────────────────────────────────
function TimelineDialog({
  entry,
  open,
  onClose,
}: {
  entry: AuditEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!entry) return null;

  const timelineSteps = entry.timeline ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[var(--maxwell-text-primary)]">
            Document Timeline
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--maxwell-text-secondary)]">
            {entry.documentName}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {timelineSteps.length === 0 ? (
            <p className="text-sm text-[var(--maxwell-text-secondary)] py-4">
              No timeline data available for this entry.
            </p>
          ) : (
            <div className="relative pl-4">
              {/* Vertical connecting line */}
              <div
                className="absolute left-[19px] top-2 bottom-2 w-px"
                style={{ backgroundColor: 'var(--maxwell-border)' }}
              />
              <div className="space-y-5">
                {timelineSteps.map((step, idx) => {
                  const isLast = idx === timelineSteps.length - 1;
                  const isWarning = step.status === 'warning';
                  const isError = step.status === 'error';
                  const dotColor = isError
                    ? 'bg-red-500'
                    : isWarning
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';
                  const ringColor = isError
                    ? 'ring-red-200'
                    : isWarning
                      ? 'ring-amber-200'
                      : 'ring-emerald-200';

                  return (
                    <motion.div
                      key={step.label}
                      className="relative flex gap-3 items-start"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.25, ease: easeOut }}
                    >
                      {/* Dot */}
                      <div
                        className={cn(
                          'relative z-10 w-[11px] h-[11px] rounded-full mt-1.5 shrink-0 ring-4',
                          dotColor,
                          ringColor
                        )}
                      />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--maxwell-text-primary)]">
                            {step.label}
                          </span>
                          {step.confidence !== undefined && (
                            <ConfidenceBadge confidence={step.confidence} />
                          )}
                        </div>
                        <p className="text-xs text-[var(--maxwell-text-secondary)] mt-0.5">
                          {step.action}
                        </p>
                        <p className="text-[11px] text-[var(--maxwell-text-tertiary)] mt-0.5">
                          {formatTimestamp(step.timestamp)}
                        </p>
                        {step.detail && (
                          <p className="text-xs text-[var(--maxwell-text-secondary)] mt-1">
                            {step.detail}
                          </p>
                        )}
                      </div>
                      {!isLast && (
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--maxwell-text-tertiary)] mt-1.5 shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review queue link for anomalies */}
          {entry.failureCode && (
            <div className="mt-5 pt-3 border-t" style={{ borderColor: 'var(--maxwell-border)' }}>
              <div className="flex items-center gap-2 text-xs text-[var(--maxwell-text-secondary)]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Failure code: <strong className="font-mono">{entry.failureCode}</strong>
                </span>
              </div>
              <button
                className="mt-2 text-xs font-medium text-[var(--maxwell-primary)] hover:underline transition-all"
                onClick={() => {
                  // Placeholder for review queue navigation
                  window.open('/review-queue', '_blank');
                }}
              >
                View human review queue &rarr;
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Anomaly Alert Banner ─────────────────────────────────────────────────────
function AnomalyBanner({
  entry,
  onDismiss,
}: {
  entry: AuditEntry;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.25, ease: easeSmooth }}
      className="mb-4 rounded-lg border overflow-hidden"
      style={{
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
          style={{ backgroundColor: '#FEF3C7' }}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900">
            Anomaly Detected — {entry.documentName}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {entry.description}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] text-amber-600">
              {formatRelativeTime(entry.timestamp)}
            </span>
            {entry.failureCode && (
              <span className="text-[11px] font-mono text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                {entry.failureCode}
              </span>
            )}
            <button
              className="text-[11px] font-medium text-amber-800 hover:underline"
              onClick={() => window.open('/review-queue', '_blank')}
            >
              Check review queue &rarr;
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-200/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ActivityLedger (now MaxwellAuditTrail) ──────────────────────────────
export default function ActivityLedger() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<AuditCategory>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceThreshold>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  // ── Dismiss alert handler ──────────────────────────────────────────────────
  const dismissAlert = useCallback((id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  }, []);

  // ── Open timeline handler ──────────────────────────────────────────────────
  const openTimeline = useCallback((entry: AuditEntry) => {
    setSelectedEntry(entry);
    setTimelineOpen(true);
  }, []);

  // ── Close timeline handler ─────────────────────────────────────────────────
  const closeTimeline = useCallback(() => {
    setTimelineOpen(false);
    setSelectedEntry(null);
  }, []);

  // ── Filtered entries ───────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    return demoActivity.filter((entry) => {
      // Category filter
      if (activeCategory !== 'all' && entry.category !== activeCategory) return false;

      // Confidence filter
      if (confidenceFilter === 'high' && (entry.confidence === undefined || entry.confidence < 0.9))
        return false;
      if (confidenceFilter === 'medium' && (entry.confidence === undefined || entry.confidence < 0.7))
        return false;

      return true;
    });
  }, [activeCategory, confidenceFilter]);

  // ── Anomalies to show in banner ────────────────────────────────────────────
  const activeAnomalies = useMemo(() => {
    return demoActivity.filter(
      (entry) =>
        entry.action === 'anomaly' &&
        !dismissedAlerts.has(entry.id) &&
        (entry.failureCode === 'F-002' || entry.failureCode === 'F-005')
    );
  }, [dismissedAlerts]);

  // ── Category filter tabs ───────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    AUDIT_CATEGORIES.forEach((cat) => {
      if (cat.value === 'all') {
        counts[cat.value] = demoActivity.length;
      } else {
        counts[cat.value] = demoActivity.filter((e) => e.category === cat.value).length;
      }
    });
    return counts;
  }, []);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2
            className="text-h2 font-semibold"
            style={{ color: 'var(--maxwell-text-primary)' }}
          >
            Maxwell Audit Trail
          </h2>
          <p className="text-body-sm mt-0.5" style={{ color: 'var(--maxwell-text-secondary)' }}>
            Track every action Maxwell takes on your documents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={confidenceFilter}
            onValueChange={(v) => setConfidenceFilter(v as ConfidenceThreshold)}
          >
            <SelectTrigger className="h-8 text-xs w-[150px]" size="sm">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              {CONFIDENCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Anomaly Alert Banners ──────────────────────────────────────────── */}
      <AnimatePresence>
        {activeAnomalies.map((anomaly) => (
          <AnomalyBanner
            key={anomaly.id}
            entry={anomaly}
            onDismiss={() => dismissAlert(anomaly.id)}
          />
        ))}
      </AnimatePresence>

      {/* ── Category Filter Tabs ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {AUDIT_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          const IconComponent =
            cat.icon === 'Upload'
              ? Upload
              : cat.icon === 'FileText'
                ? FileText
                : cat.icon === 'Search'
                  ? Search
                  : cat.icon === 'Download'
                    ? Download
                    : cat.icon === 'AlertTriangle'
                      ? AlertTriangle
                      : List;

          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
                isActive
                  ? 'border-transparent text-white'
                  : 'border-[var(--maxwell-border)] text-[var(--maxwell-text-secondary)] hover:bg-[var(--maxwell-border-subtle)]'
              )}
              style={
                isActive
                  ? { backgroundColor: 'var(--maxwell-primary)' }
                  : { backgroundColor: 'transparent' }
              }
            >
              <IconComponent className="w-3.5 h-3.5" />
              {cat.label}
              <span
                className={cn(
                  'ml-0.5 text-[10px] font-semibold min-w-[18px] text-center rounded-full px-1 py-0.5',
                  isActive ? 'bg-white/20 text-white' : 'bg-[var(--maxwell-border-subtle)] text-[var(--maxwell-text-tertiary)]'
                )}
              >
                {categoryCounts[cat.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Audit Trail List ───────────────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--maxwell-surface)',
          borderColor: 'var(--maxwell-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {filteredEntries.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <List className="w-8 h-8 text-[var(--maxwell-text-tertiary)] mb-2" />
              <p className="text-sm font-medium text-[var(--maxwell-text-secondary)]">
                No entries match your filters.
              </p>
              <p className="text-xs text-[var(--maxwell-text-tertiary)] mt-0.5">
                Try adjusting the category or confidence filter.
              </p>
            </motion.div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: idx * 0.03, duration: 0.2, ease: easeOut }}
                className={cn(
                  'flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--maxwell-border-subtle)]/50 cursor-pointer group',
                  idx !== filteredEntries.length - 1 && 'border-b',
                  entry.status === 'alert' && 'bg-amber-50/40 hover:bg-amber-50/60'
                )}
                style={
                  idx !== filteredEntries.length - 1
                    ? { borderColor: 'var(--maxwell-border)' }
                    : undefined
                }
                onClick={() => {
                  if (entry.timeline) {
                    openTimeline(entry);
                  }
                }}
              >
                {/* Action icon circle */}
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--maxwell-primary-light)' }}
                >
                  <div
                    className="text-[var(--maxwell-primary)]"
                  >
                    <ActionIcon action={entry.action} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      className="text-sm font-medium text-[var(--maxwell-text-primary)] hover:text-[var(--maxwell-primary)] transition-colors text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTimeline(entry);
                      }}
                    >
                      {entry.documentName}
                    </button>
                    {entry.confidence !== undefined && (
                      <ConfidenceBadge confidence={entry.confidence} />
                    )}
                    {entry.failureCode && (
                      <span className="text-[10px] font-mono font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {entry.failureCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--maxwell-text-secondary)] mt-0.5">
                    {entry.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-[var(--maxwell-text-tertiary)]">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                    <span className="text-[var(--maxwell-text-tertiary)]">&middot;</span>
                    <span className="text-[11px] text-[var(--maxwell-text-tertiary)]">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Right: status icon + chevron */}
                <div className="flex items-center gap-1.5 shrink-0 mt-1">
                  <StatusIcon status={entry.status} />
                  {entry.timeline && (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--maxwell-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer count ───────────────────────────────────────────────────── */}
      <p className="text-[11px] text-[var(--maxwell-text-tertiary)] mt-2 text-right">
        Showing {filteredEntries.length} of {demoActivity.length} entries
      </p>

      {/* ── Timeline Dialog ────────────────────────────────────────────────── */}
      <TimelineDialog
        entry={selectedEntry}
        open={timelineOpen}
        onClose={closeTimeline}
      />
    </motion.div>
  );
}
