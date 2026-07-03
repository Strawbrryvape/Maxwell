// C7: Identity Vault — Maxwell
// Securely store and cross-reference identity documents
// AGPL v3 — Syntropy LLC

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Globe,
  Car,
  Baby,
  CreditCard,
  FileCheck,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Link2,
  ChevronDown,
  ChevronUp,
  FileText,
  Award,
} from 'lucide-react';

const API_BASE_URL =
  (typeof window !== 'undefined' &&
    (window as unknown as { __MAXWELL_API_URL__?: string }).__MAXWELL_API_URL__) ||
  '';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// ── Types ────────────────────────────────────────────────────────────────────

type IdentityDocType =
  | 'passport'
  | 'drivers_license'
  | 'ssn_card'
  | 'birth_certificate'
  | 'id_card'
  | 'visa';

type DocumentStatus = 'valid' | 'expiring_soon' | 'expired';

interface IdentityListItem {
  id: string;
  type: IdentityDocType;
  title: string;
  document_number_masked: string;
  issuing_authority: string;
  issue_date: string;
  expiration_date: string;
  status: DocumentStatus;
  verified: boolean;
  associated_documents: string[];
}

interface IdentityDocumentInput {
  type: IdentityDocType;
  title: string;
  document_number: string;
  issuing_authority: string;
  issue_date: string;
  expiration_date: string;
  associated_document_ids?: string[];
}

interface VerificationStatus {
  overall_status: 'complete' | 'partial' | 'missing';
  completion_percentage: number;
  missing_types: string[];
  expired_count: number;
  expiring_soon_count: number;
  recommendations: string[];
}

interface CrossReferenceResult {
  identity_doc: IdentityListItem | null;
  matched_documents: Array<{
    doc_id: string;
    match_type: 'name' | 'address' | 'number';
    confidence: number;
  }>;
}

// ── Icon Map ─────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<IdentityDocType, React.ReactNode> = {
  passport: <Globe size={22} />,
  drivers_license: <Car size={22} />,
  ssn_card: <Shield size={22} />,
  birth_certificate: <Baby size={22} />,
  id_card: <CreditCard size={22} />,
  visa: <FileCheck size={22} />,
};

const TYPE_LABEL: Record<IdentityDocType, string> = {
  passport: 'Passport',
  drivers_license: "Driver's License",
  ssn_card: 'SSN Card',
  birth_certificate: 'Birth Certificate',
  id_card: 'ID Card',
  visa: 'Visa',
};

const ALL_TYPES: IdentityDocType[] = [
  'passport',
  'drivers_license',
  'ssn_card',
  'birth_certificate',
  'id_card',
  'visa',
];

// ── Color helpers ────────────────────────────────────────────────────────────

function statusColor(status: DocumentStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'valid':
      return {
        bg: 'var(--maxwell-secondary-light)',
        text: 'var(--maxwell-secondary)',
        border: 'var(--category-medical-border)',
      };
    case 'expiring_soon':
      return {
        bg: 'var(--maxwell-accent-light)',
        text: 'var(--maxwell-accent)',
        border: 'var(--category-financial-border)',
      };
    case 'expired':
      return {
        bg: 'var(--maxwell-danger-light)',
        text: 'var(--maxwell-danger)',
        border: '#FECACA',
      };
  }
}

function statusLabel(status: DocumentStatus): string {
  switch (status) {
    case 'valid':
      return 'Valid';
    case 'expiring_soon':
      return 'Expiring Soon';
    case 'expired':
      return 'Expired';
  }
}

function statusIcon(status: DocumentStatus) {
  switch (status) {
    case 'valid':
      return <CheckCircle2 size={14} />;
    case 'expiring_soon':
      return <AlertTriangle size={14} />;
    case 'expired':
      return <AlertCircle size={14} />;
  }
}

// ── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({
  percentage,
  size = 72,
  strokeWidth = 6,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--maxwell-border-subtle)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--maxwell-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: easeOut }}
        />
      </svg>
      <span
        className="absolute font-bold"
        style={{ fontSize: '14px', color: 'var(--maxwell-text-primary)' }}
      >
        {percentage}%
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function IdentityVault() {
  const [documents, setDocuments] = useState<IdentityListItem[]>([]);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [crossRef, setCrossRef] = useState<CrossReferenceResult | null>(null);
  const [crossRefLoading, setCrossRefLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<IdentityDocumentInput>({
    type: 'passport',
    title: '',
    document_number: '',
    issuing_authority: '',
    issue_date: '',
    expiration_date: '',
  });

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('maxwell_token')
      : null;

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  // ── Fetch documents ────────────────────────────────────────────────────────

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/identity/documents`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    }
  }, [headers]);

  // ── Fetch verification status ──────────────────────────────────────────────

  const fetchVerification = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/identity/verification-status`, {
        headers,
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setVerification(data);
    } catch {
      // silent
    }
  }, [headers]);

  // ── Load on mount ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      await Promise.all([fetchDocuments(), fetchVerification()]);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchDocuments, fetchVerification]);

  // ── Add document ───────────────────────────────────────────────────────────

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.document_number || !formData.issuing_authority) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/identity/documents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      await fetchDocuments();
      await fetchVerification();
      setShowAddDialog(false);
      setFormData({
        type: 'passport',
        title: '',
        document_number: '',
        issuing_authority: '',
        issue_date: '',
        expiration_date: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete document ────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this identity document?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/identity/documents/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      await fetchDocuments();
      await fetchVerification();
      if (expandedDoc === id) {
        setExpandedDoc(null);
        setCrossRef(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  // ── Cross-reference ────────────────────────────────────────────────────────

  const toggleCrossReference = async (id: string) => {
    if (expandedDoc === id) {
      setExpandedDoc(null);
      setCrossRef(null);
      setSelectedDocId(null);
      return;
    }
    setExpandedDoc(id);
    setSelectedDocId(id);
    setCrossRefLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/identity/cross-reference/${id}`,
        { headers }
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setCrossRef(data);
    } catch {
      setCrossRef(null);
    } finally {
      setCrossRefLoading(false);
    }
  };

  // ── Count present types ────────────────────────────────────────────────────

  const presentTypes = useMemo(
    () => new Set(documents.map((d) => d.type)),
    [documents]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Shield size={32} style={{ color: 'var(--maxwell-accent)' }} className="animate-pulse" />
          <span style={{ color: 'var(--maxwell-text-tertiary)', fontSize: '14px' }}>
            Loading Identity Vault...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield size={28} style={{ color: 'var(--maxwell-accent)' }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--maxwell-text-primary)', fontFamily: 'Inter, sans-serif' }}
          >
            Identity Vault
          </h1>
        </div>
        <p style={{ color: 'var(--maxwell-text-secondary)', fontSize: '14px' }}>
          Securely store and cross-reference your identity documents
        </p>
      </motion.div>

      {/* ── Verification Status Header ─────────────────────────────────────── */}
      {verification && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
          className="mb-8 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5"
          style={{
            backgroundColor: 'var(--maxwell-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--maxwell-border-subtle)',
          }}
        >
          <ProgressRing percentage={verification.completion_percentage} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-semibold"
                style={{ color: 'var(--maxwell-text-primary)', fontSize: '15px' }}
              >
                {verification.overall_status === 'complete'
                  ? 'Profile Complete'
                  : verification.overall_status === 'partial'
                    ? 'Profile Partial'
                    : 'Profile Incomplete'}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor:
                    verification.overall_status === 'complete'
                      ? 'var(--maxwell-secondary-light)'
                      : 'var(--maxwell-accent-light)',
                  color:
                    verification.overall_status === 'complete'
                      ? 'var(--maxwell-secondary)'
                      : 'var(--maxwell-accent)',
                }}
              >
                {presentTypes.size} of {ALL_TYPES.length} types
              </span>
            </div>
            <p style={{ color: 'var(--maxwell-text-secondary)', fontSize: '13px' }}>
              {verification.overall_status === 'complete'
                ? 'All identity document types are stored and verified.'
                : `${verification.missing_types.length} document type${verification.missing_types.length > 1 ? 's' : ''} missing. Add them for a complete profile.`}
              {verification.expiring_soon_count > 0 && (
                <span className="ml-1" style={{ color: 'var(--maxwell-accent)' }}>
                  {verification.expiring_soon_count} document{verification.expiring_soon_count > 1 ? 's' : ''}{' '}
                  expiring soon.
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--maxwell-accent)',
              color: '#fff',
            }}
          >
            <Plus size={16} />
            Add Document
          </button>
        </motion.div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-6 p-4 rounded-lg flex items-center justify-between"
            style={{
              backgroundColor: 'var(--maxwell-danger-light)',
              border: '1px solid #FECACA',
            }}
          >
            <div className="flex items-center gap-2" style={{ color: 'var(--maxwell-danger)' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '13px' }}>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              style={{ color: 'var(--maxwell-danger)' }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recommendations ────────────────────────────────────────────────── */}
      {verification && verification.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut, delay: 0.15 }}
          className="mb-8"
        >
          <h2
            className="font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--maxwell-text-primary)', fontSize: '15px' }}
          >
            <Award size={18} style={{ color: 'var(--maxwell-accent)' }} />
            Recommendations
          </h2>
          <div
            className="divide-y"
            style={{
              backgroundColor: 'var(--maxwell-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--maxwell-border-subtle)',
            }}
          >
            {verification.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="px-4 py-3 flex items-center gap-3"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: rec.includes('expires') || rec.includes('expired')
                      ? 'var(--maxwell-danger)'
                      : rec.includes('missing') || rec.includes('Add')
                        ? 'var(--maxwell-accent)'
                        : 'var(--maxwell-primary)',
                  }}
                />
                <span style={{ fontSize: '13px', color: 'var(--maxwell-text-secondary)' }}>
                  {rec}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Documents Grid ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-semibold flex items-center gap-2"
            style={{ color: 'var(--maxwell-text-primary)', fontSize: '15px' }}
          >
            <FileText size={18} style={{ color: 'var(--maxwell-accent)' }} />
            Your Documents
          </h2>
          <span style={{ color: 'var(--maxwell-text-tertiary)', fontSize: '13px' }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {documents.length === 0 ? (
          <div
            className="text-center py-16"
            style={{
              backgroundColor: 'var(--maxwell-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--maxwell-border)',
            }}
          >
            <Shield
              size={40}
              style={{ color: 'var(--maxwell-border)', margin: '0 auto 12px' }}
            />
            <p style={{ color: 'var(--maxwell-text-tertiary)', fontSize: '14px' }}>
              No identity documents stored yet.
            </p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--maxwell-accent)', color: '#fff' }}
            >
              Add Your First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, index) => {
              const colors = statusColor(doc.status);
              const isExpanded = expandedDoc === doc.id;
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: easeOut, delay: index * 0.06 }}
                  layout
                >
                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--maxwell-surface)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-md)',
                      border:
                        selectedDocId === doc.id
                          ? '1.5px solid var(--maxwell-accent)'
                          : '1px solid var(--maxwell-border-subtle)',
                    }}
                  >
                    {/* Card Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: 'var(--maxwell-accent-light)',
                            color: 'var(--maxwell-accent)',
                          }}
                        >
                          {TYPE_ICON[doc.type]}
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.verified && (
                            <span title="Verified" aria-label="Verified">
                              <CheckCircle2
                                size={16}
                                style={{ color: 'var(--maxwell-secondary)' }}
                              />
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: 'var(--maxwell-text-tertiary)' }}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3
                        className="font-semibold truncate"
                        style={{
                          fontSize: '14px',
                          color: 'var(--maxwell-text-primary)',
                        }}
                      >
                        {doc.title}
                      </h3>
                      <p
                        className="mt-0.5 font-mono"
                        style={{ fontSize: '13px', color: 'var(--maxwell-text-tertiary)' }}
                      >
                        {doc.document_number_masked}
                      </p>

                      <p
                        className="mt-1 truncate"
                        style={{ fontSize: '12px', color: 'var(--maxwell-text-secondary)' }}
                      >
                        {doc.issuing_authority}
                      </p>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {statusIcon(doc.status)}
                          {statusLabel(doc.status)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--maxwell-text-tertiary)' }}
                        >
                          Exp: {doc.expiration_date}
                        </span>
                      </div>

                      {/* Cross-reference toggle */}
                      <button
                        onClick={() => toggleCrossReference(doc.id)}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                        style={{
                          color: 'var(--maxwell-accent)',
                          backgroundColor: isExpanded
                            ? 'var(--maxwell-accent-light)'
                            : 'transparent',
                        }}
                      >
                        <Link2 size={13} />
                        {isExpanded ? 'Hide References' : 'Cross-Reference'}
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>

                    {/* Expanded Cross-Reference Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: easeOut }}
                          className="overflow-hidden"
                        >
                          <div
                            className="px-4 pb-4 pt-1"
                            style={{ borderTop: '1px solid var(--maxwell-border-subtle)' }}
                          >
                            {crossRefLoading ? (
                              <div
                                className="py-3 text-center"
                                style={{ color: 'var(--maxwell-text-tertiary)', fontSize: '12px' }}
                              >
                                Loading cross-references...
                              </div>
                            ) : crossRef && crossRef.matched_documents.length > 0 ? (
                              <div>
                                <p
                                  className="text-xs font-medium mb-2"
                                  style={{ color: 'var(--maxwell-text-secondary)' }}
                                >
                                  Referenced in stored documents:
                                </p>
                                {crossRef.matched_documents.map((match) => (
                                  <div
                                    key={match.doc_id}
                                    className="flex items-center justify-between py-1.5"
                                  >
                                    <span
                                      className="text-xs truncate max-w-[200px]"
                                      style={{ color: 'var(--maxwell-text-secondary)' }}
                                    >
                                      {match.doc_id.replace(/doc-|-/g, ' ').replace(/^\w/, (c) =>
                                        c.toUpperCase()
                                      )}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded"
                                        style={{
                                          backgroundColor: 'var(--maxwell-primary-light)',
                                          color: 'var(--maxwell-primary)',
                                          fontSize: '11px',
                                        }}
                                      >
                                        {match.match_type}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          color: 'var(--maxwell-text-tertiary)',
                                        }}
                                      >
                                        {Math.round(match.confidence * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p
                                className="py-2 text-center"
                                style={{
                                  color: 'var(--maxwell-text-tertiary)',
                                  fontSize: '12px',
                                }}
                              >
                                No stored document references found.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Missing Types Reminder ─────────────────────────────────────────── */}
      {verification && verification.missing_types.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-8"
        >
          <h3
            className="font-semibold mb-3"
            style={{ color: 'var(--maxwell-text-primary)', fontSize: '14px' }}
          >
            Missing Document Types
          </h3>
          <div className="flex flex-wrap gap-2">
            {ALL_TYPES.filter((t) => !presentTypes.has(t)).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, type }));
                  setShowAddDialog(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-[1.02]"
                style={{
                  borderColor: 'var(--maxwell-border)',
                  backgroundColor: 'var(--maxwell-surface)',
                  color: 'var(--maxwell-text-secondary)',
                  fontSize: '13px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ opacity: 0.5 }}>{TYPE_ICON[type]}</span>
                <span>{TYPE_LABEL[type]}</span>
                <Plus size={14} style={{ color: 'var(--maxwell-accent)' }} />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Add Document Dialog ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddDialog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/40"
              onClick={() => !submitting && setShowAddDialog(false)}
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="fixed z-[71] inset-x-4 top-[5vh] sm:inset-auto sm:top-[8vh] sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[480px] max-h-[85vh] overflow-y-auto"
              style={{
                backgroundColor: 'var(--maxwell-surface)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: 'var(--maxwell-text-primary)' }}
                  >
                    Add Identity Document
                  </h2>
                  <button
                    onClick={() => setShowAddDialog(false)}
                    disabled={submitting}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--maxwell-text-tertiary)' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddDocument} className="space-y-4">
                  {/* Type */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--maxwell-text-primary)' }}
                    >
                      Document Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value as IdentityDocType,
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                      style={{
                        borderColor: 'var(--maxwell-border)',
                        color: 'var(--maxwell-text-primary)',
                        backgroundColor: 'var(--maxwell-surface)',
                      }}
                    >
                      {ALL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--maxwell-text-primary)' }}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g. US Passport"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                      style={{
                        borderColor: 'var(--maxwell-border)',
                        color: 'var(--maxwell-text-primary)',
                        backgroundColor: 'var(--maxwell-surface)',
                      }}
                    />
                  </div>

                  {/* Document Number */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--maxwell-text-primary)' }}
                    >
                      Document Number
                    </label>
                    <input
                      type="text"
                      value={formData.document_number}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          document_number: e.target.value,
                        }))
                      }
                      placeholder="Enter full number"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors font-mono"
                      style={{
                        borderColor: 'var(--maxwell-border)',
                        color: 'var(--maxwell-text-primary)',
                        backgroundColor: 'var(--maxwell-surface)',
                      }}
                    />
                    <p
                      className="mt-1"
                      style={{ fontSize: '11px', color: 'var(--maxwell-text-tertiary)' }}
                    >
                      Stored securely. Only last 4 digits will be displayed.
                    </p>
                  </div>

                  {/* Issuing Authority */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--maxwell-text-primary)' }}
                    >
                      Issuing Authority
                    </label>
                    <input
                      type="text"
                      value={formData.issuing_authority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          issuing_authority: e.target.value,
                        }))
                      }
                      placeholder="e.g. U.S. Department of State"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                      style={{
                        borderColor: 'var(--maxwell-border)',
                        color: 'var(--maxwell-text-primary)',
                        backgroundColor: 'var(--maxwell-surface)',
                      }}
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--maxwell-text-primary)' }}
                      >
                        Issue Date
                      </label>
                      <input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            issue_date: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                        style={{
                          borderColor: 'var(--maxwell-border)',
                          color: 'var(--maxwell-text-primary)',
                          backgroundColor: 'var(--maxwell-surface)',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--maxwell-text-primary)' }}
                      >
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        value={formData.expiration_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expiration_date: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                        style={{
                          borderColor: 'var(--maxwell-border)',
                          color: 'var(--maxwell-text-primary)',
                          backgroundColor: 'var(--maxwell-surface)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddDialog(false)}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        border: '1px solid var(--maxwell-border)',
                        color: 'var(--maxwell-text-secondary)',
                        backgroundColor: 'var(--maxwell-surface)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-60"
                      style={{
                        backgroundColor: 'var(--maxwell-accent)',
                        color: '#fff',
                      }}
                    >
                      {submitting ? 'Adding...' : 'Add Document'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
