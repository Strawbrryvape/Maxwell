// C5: Insight Engine — Maxwell
// Pattern detection, anomaly alerts, and document timeline
// AGPL v3 — Syntropy LLC

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  HardDrive,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API_BASE = '/api';
const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// ── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
  total_documents: number;
  documents_by_category: Record<string, number>;
  monthly_upload_trend: { month: string; count: number }[];
  storage_used_mb: number;
  parsing_success_rate: number;
}

interface Pattern {
  id: string;
  type: 'recurring' | 'anomaly' | 'cluster';
  title: string;
  description: string;
  confidence: number;
  affected_documents: string[];
  detected_at: string;
}

interface Anomaly {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  document_id?: string;
  amount?: number;
  expected_range?: string;
}

interface TimelineEvent {
  date: string;
  type: 'upload' | 'payment_due' | 'expiration';
  document_id: string;
  title: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#7c3aed',
  Medical: '#dc2626',
  Financial: '#059669',
  Legal: '#2563eb',
  Vehicle: '#d97706',
  Employment: '#0891b2',
  General: '#6b7280',
};

const TYPE_COLORS: Record<string, string> = {
  recurring: '#059669',
  anomaly: '#dc2626',
  cluster: '#7c3aed',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

// ── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  subtext,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl border p-4"
      style={{
        backgroundColor: 'var(--maxwell-surface)',
        borderColor: 'var(--maxwell-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ backgroundColor: `${accent}15`, color: accent }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--maxwell-text-tertiary)' }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--maxwell-text-primary)' }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--maxwell-text-tertiary)' }}>
        {subtext}
      </p>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
      style={{
        color: active ? '#0d9488' : 'var(--maxwell-text-secondary)',
        backgroundColor: active ? '#ccfbf1' : 'transparent',
      }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0">{count}</Badge>
      )}
    </button>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 0.8 ? '#059669' : confidence >= 0.5 ? '#d97706' : '#dc2626';
  const label = `${Math.round(confidence * 100)}%`;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {label} confidence
    </span>
  );
}

function MiniBarChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="flex items-end gap-2 h-24 mt-4">
      {data.map((d, i) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full rounded-t-md"
            style={{ backgroundColor: '#0d9488' }}
            initial={{ height: 0 }}
            animate={{ height: `${(d.count / max) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          />
          <span className="text-[10px] font-medium" style={{ color: 'var(--maxwell-text-tertiary)' }}>
            {formatMonthLabel(d.month)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function InsightEngine() {
  const [activeTab, setActiveTab] = useState<'patterns' | 'anomalies' | 'timeline'>('patterns');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [dismissedAnomalies, setDismissedAnomalies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ovRes, pRes, aRes, tRes] = await Promise.all([
          fetch(`${API_BASE}/insights/overview`),
          fetch(`${API_BASE}/insights/patterns`),
          fetch(`${API_BASE}/insights/anomalies`),
          fetch(`${API_BASE}/insights/timeline`),
        ]);
        const ovData = await ovRes.json();
        const pData = await pRes.json();
        const aData = await aRes.json();
        const tData = await tRes.json();
        setOverview(ovData);
        setPatterns(pData.patterns || []);
        setAnomalies(aData.anomalies || []);
        setTimeline(tData.events || []);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const dismissAnomaly = useCallback((id: string) => {
    setDismissedAnomalies(prev => new Set(prev).add(id));
  }, []);

  const visibleAnomalies = anomalies.filter(a => !dismissedAnomalies.has(a.id));

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle size={16} style={{ color: '#dc2626' }} />;
      case 'medium': return <AlertTriangle size={16} style={{ color: '#d97706' }} />;
      default: return <CheckCircle size={16} style={{ color: '#059669' }} />;
    }
  };

  const severityBg = (severity: string) => {
    switch (severity) {
      case 'high': return '#fef2f2';
      case 'medium': return '#fffbeb';
      default: return '#f0fdf4';
    }
  };

  const timelineDotColor = (type: string) => {
    switch (type) {
      case 'upload': return '#2563eb';
      case 'payment_due': return '#dc2626';
      case 'expiration': return '#d97706';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-container mx-auto px-4 sm:px-8 lg:px-10 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded" style={{ backgroundColor: 'var(--maxwell-border)', width: '40%' }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: 'var(--maxwell-surface)', boxShadow: 'var(--shadow-sm)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-container mx-auto px-4 sm:px-8 lg:px-10 py-6">
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
      >
        <h1
          className="font-semibold flex items-center gap-3"
          style={{
            fontSize: 'clamp(22px, 3vw, 28px)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--maxwell-text-primary)',
          }}
        >
          <Brain size={28} style={{ color: '#0d9488' }} />
          Insight Engine
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
          Pattern detection, anomalies, and document timeline
        </p>
      </motion.div>

      {/* Overview Cards */}
      {overview && (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            icon={<FileText size={16} />}
            label="Total Documents"
            value={overview.total_documents.toString()}
            subtext={`Across ${Object.keys(overview.documents_by_category).length} categories`}
            accent="#2563eb"
            delay={0}
          />
          <StatCard
            icon={<TrendingUp size={16} />}
            label="This Month"
            value={`${overview.monthly_upload_trend[overview.monthly_upload_trend.length - 1]?.count ?? 0}`}
            subtext="Documents uploaded"
            accent="#0d9488"
            delay={0.05}
          />
          <StatCard
            icon={<HardDrive size={16} />}
            label="Storage Used"
            value={`${overview.storage_used_mb.toFixed(1)} MB`}
            subtext={`${overview.parsing_success_rate}% parse success`}
            accent="#7c3aed"
            delay={0.1}
          />
          <StatCard
            icon={<Activity size={16} />}
            label="Parse Rate"
            value={`${overview.parsing_success_rate}%`}
            subtext="Documents parsed successfully"
            accent="#059669"
            delay={0.15}
          />
        </motion.div>
      )}

      {/* Trend Chart */}
      {overview && (
        <motion.div
          className="rounded-xl border p-4 mb-6"
          style={{
            backgroundColor: 'var(--maxwell-surface)',
            borderColor: 'var(--maxwell-border-subtle)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: '#0d9488' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--maxwell-text-primary)' }}>
              Monthly Upload Trend
            </h3>
          </div>
          <MiniBarChart data={overview.monthly_upload_trend} />
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        className="flex flex-wrap gap-2 mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TabButton
          active={activeTab === 'patterns'}
          onClick={() => setActiveTab('patterns')}
          icon={<Brain size={16} />}
          label="Patterns"
          count={patterns.length}
        />
        <TabButton
          active={activeTab === 'anomalies'}
          onClick={() => setActiveTab('anomalies')}
          icon={<AlertTriangle size={16} />}
          label="Anomalies"
          count={visibleAnomalies.length}
        />
        <TabButton
          active={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
          icon={<Clock size={16} />}
          label="Timeline"
          count={timeline.length}
        />
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ── Patterns Tab ── */}
        {activeTab === 'patterns' && (
          <motion.div
            key="patterns"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-2.5"
          >
            <AnimatePresence>
              {patterns.map((pattern, i) => (
                <motion.div
                  key={pattern.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: 'var(--maxwell-surface)',
                    borderLeft: `3px solid ${TYPE_COLORS[pattern.type] || '#6b7280'}`,
                    borderColor: 'var(--maxwell-border-subtle)',
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge
                      variant="outline"
                      className="text-xs capitalize"
                      style={{ borderColor: TYPE_COLORS[pattern.type], color: TYPE_COLORS[pattern.type] }}
                    >
                      {pattern.type}
                    </Badge>
                    <ConfidenceBadge confidence={pattern.confidence} />
                    <span className="text-xs ml-auto" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                      {pattern.affected_documents.length} doc{pattern.affected_documents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--maxwell-text-primary)' }}>
                    {pattern.title}
                  </h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--maxwell-text-secondary)' }}>
                    {pattern.description}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Anomalies Tab ── */}
        {activeTab === 'anomalies' && (
          <motion.div
            key="anomalies"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-2.5"
          >
            <AnimatePresence>
              {visibleAnomalies.map((anomaly, i) => (
                <motion.div
                  key={anomaly.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 80 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-4 relative"
                  style={{
                    backgroundColor: severityBg(anomaly.severity),
                    borderColor: anomaly.severity === 'high' ? '#fecaca' : anomaly.severity === 'medium' ? '#fde68a' : '#bbf7d0',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {severityIcon(anomaly.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {anomaly.severity}
                        </Badge>
                        <span className="text-xs" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                          {anomaly.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--maxwell-text-primary)' }}>
                        {anomaly.description}
                      </p>
                      {anomaly.amount !== undefined && (
                        <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>
                          Amount: ${anomaly.amount.toLocaleString()}
                          {anomaly.expected_range && ` · Expected: ${anomaly.expected_range}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => dismissAnomaly(anomaly.id)}
                      className="flex-shrink-0 p-1.5 rounded-md transition-colors hover:bg-black/5"
                      style={{ color: 'var(--maxwell-text-tertiary)' }}
                      title="Dismiss"
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {visibleAnomalies.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <CheckCircle size={32} className="mx-auto mb-3" style={{ color: '#059669' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--maxwell-text-secondary)' }}>
                  All clear!
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                  No anomalies detected.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Timeline Tab ── */}
        {activeTab === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative pl-6">
              {/* Vertical line */}
              <div
                className="absolute left-[9px] top-0 bottom-0 w-px"
                style={{ backgroundColor: 'var(--maxwell-border)' }}
              />
              <AnimatePresence>
                {timeline.map((event, i) => (
                  <motion.div
                    key={event.document_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative mb-5"
                  >
                    {/* Dot */}
                    <div
                      className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: CATEGORY_COLORS[event.category] || '#6b7280',
                        backgroundColor: 'var(--maxwell-surface)',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[event.category] || '#6b7280' }}
                      />
                    </div>
                    <div
                      className="rounded-lg border p-3"
                      style={{
                        backgroundColor: 'var(--maxwell-surface)',
                        borderColor: 'var(--maxwell-border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium" style={{ color: timelineDotColor(event.type) }}>
                          {event.type === 'upload' ? 'Upload' : event.type === 'payment_due' ? 'Payment Due' : 'Expiring'}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--maxwell-text-tertiary)' }}>
                          {formatDateShort(event.date)}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs ml-auto"
                          style={{
                            borderColor: CATEGORY_COLORS[event.category],
                            color: CATEGORY_COLORS[event.category],
                          }}
                        >
                          {event.category}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--maxwell-text-primary)' }}>
                        {event.title}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
