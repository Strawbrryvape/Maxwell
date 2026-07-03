import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import SemanticSearchBar from '@/components/SemanticSearchBar';
import UploadZone from '@/components/UploadZone';
import CategoryFilter from '@/components/CategoryFilter';
import DocumentCard from '@/components/DocumentCard';
import EmptyState from '@/components/EmptyState';
import MobileUploadFAB from '@/components/MobileUploadFAB';
import BriefingPanel from '@/components/BriefingPanel';
import Toast, { useToast } from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useParsePolling } from '@/hooks/useParsePolling';
import {
  listDocuments,
  uploadDocument,
  updateDocumentCategory,
  adaptDocumentListItem,
} from '@/lib/api';
import type { DocumentCategory, DemoDocument } from '@/data/demoDocuments';

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];
const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

/**
 * Skeleton loader shown while fetching documents.
 */
function DocumentSkeletonGrid() {
  return (
    <div
      className="grid gap-4 sm:gap-5"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut, delay: i * 0.06 }}
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--maxwell-surface)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            className="w-full animate-pulse"
            style={{
              aspectRatio: '16/10',
              backgroundColor: 'var(--maxwell-border-subtle)',
            }}
          />
          <div className="p-4 space-y-3">
            <div
              className="h-4 rounded animate-pulse"
              style={{ backgroundColor: 'var(--maxwell-border)', width: '80%' }}
            />
            <div
              className="h-3 rounded animate-pulse"
              style={{ backgroundColor: 'var(--maxwell-border-subtle)', width: '40%' }}
            />
            <div className="flex gap-3">
              <div
                className="h-3 rounded animate-pulse"
                style={{ backgroundColor: 'var(--maxwell-border-subtle)', width: '30%' }}
              />
              <div
                className="h-3 rounded animate-pulse"
                style={{ backgroundColor: 'var(--maxwell-border-subtle)', width: '30%' }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Error state with retry button.
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <p
        style={{
          fontSize: '14px',
          color: 'var(--maxwell-text-secondary)',
          textAlign: 'center',
        }}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-fast hover:scale-[1.02]"
        style={{
          backgroundColor: 'var(--maxwell-primary)',
          color: '#FFFFFF',
        }}
      >
        Retry
      </button>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { toasts, addToast, dismissToast } = useToast();

  // Document state
  const [documents, setDocuments] = useState<DemoDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'All'>('All');

  // Track uploading documents for polling
  const [_uploadingIds, setUploadingIds] = useState<Record<string, string>>({}); // fileKey -> docId

  // Parse polling: track which document is being polled after upload
  const [pollingDocId, setPollingDocId] = useState<string | null>(null);
  const { status: pollStatus, error: pollError } = useParsePolling(pollingDocId);

  // ── Fetch documents ────────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const response = await listDocuments(
        selectedCategory !== 'All' ? { category: selectedCategory } : undefined
      );
      const adapted = response.documents.map(adaptDocumentListItem);
      setDocuments(adapted);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load documents';
      setIsError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  // Load documents on mount and when auth/category changes
  useEffect(() => {
    if (isAuthenticated) {
      void fetchDocuments();
    }
  }, [isAuthenticated, fetchDocuments]);

  // Handle parse polling completion or failure
  useEffect(() => {
    if (pollStatus === 'complete' || pollStatus === 'failed') {
      setPollingDocId(null);
      void fetchDocuments(); // Refresh to show parsed data
      if (pollStatus === 'complete') {
        addToast('Document parsed successfully!', 'success');
      } else if (pollError) {
        addToast(pollError, 'error');
      }
    }
  }, [pollStatus, pollError, fetchDocuments, addToast]);

  // ── Upload handling ────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);

      // Upload each file
      for (const file of fileArray) {
        try {
          const result = await uploadDocument(file);
          addToast(
            `${result.filename} uploaded — Maxwell is reading it...`,
            'success'
          );

          // Track for polling if not immediately completed
          if (result.status !== 'completed') {
            setUploadingIds((prev) => ({ ...prev, [result.id]: result.id }));
          }

          // Start polling for parse status if pending or parsing
          if (result.status === 'pending' || result.status === 'parsing') {
            setPollingDocId(result.id);
          }

          // Refresh document list
          void fetchDocuments();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed';
          addToast(message, 'error');
        }
      }
    },
    [addToast, fetchDocuments]
  );

  // ── Category filter ────────────────────────────────────────────────────────
  // Note: When category changes, we re-fetch from API
  const handleCategorySelect = useCallback(
    (category: DocumentCategory | 'All') => {
      setSelectedCategory(category);
      // fetchDocuments will be triggered by the useEffect
    },
    []
  );

  // ── Category change on a document card ─────────────────────────────────────
  const handleCategoryChange = useCallback(
    async (id: string, category: DocumentCategory) => {
      // Optimistic UI update
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, category } : d))
      );

      try {
        await updateDocumentCategory(id, category);
        addToast('Category updated', 'success');
        // Refresh to get updated category counts
        void fetchDocuments();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update category';
        addToast(message, 'error');
        // Revert on error
        void fetchDocuments();
      }
    },
    [addToast, fetchDocuments]
  );

  // ── Category counts ────────────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    // We need to fetch counts separately; for now, compute from current documents
    // and add an 'All' count. The proper way is to refetch all docs for counts,
    // but to minimize API calls we'll use a simple approach.
    const counts: Record<string, number> = { All: 0 };
    // We don't have the full unfiltered count when filtering; the API returns it
    // For now, just use document lengths as a fallback
    counts.All = documents.length;
    documents.forEach((d) => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // ── Filtered documents ─────────────────────────────────────────────────────
  // Note: When a category is selected, the API already filters for us.
  // When 'All' is selected, we show everything from the API.
  const filteredDocuments = documents;

  return (
    <motion.div
      className="min-h-[100dvh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
    >
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Section 1: Daily Briefing */}
      <BriefingPanel />

      {/* Section 2: Hero Area */}
      <section
        className="flex flex-col items-center px-4 sm:px-8 lg:px-10"
        style={{ paddingTop: '24px', paddingBottom: '32px' }}
      >
        <div className="w-full max-w-container mx-auto flex flex-col items-center">
          {/* Tagline */}
          <motion.h1
            className="text-center font-medium"
            style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              lineHeight: '1.2',
              letterSpacing: '-0.01em',
              color: 'var(--maxwell-text-primary)',
              marginBottom: '24px',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.05 }}
          >
            Your life admin, understood.
          </motion.h1>

          {/* Search Bar */}
          <SemanticSearchBar />

          {/* Upload Zone (desktop) */}
          <div className="w-full mt-6 hidden sm:block" style={{ maxWidth: '680px' }}>
            <UploadZone onFileSelect={handleFileSelect} />
          </div>
        </div>
      </section>

      {/* Section 3 & 4: Categories + Document Grid */}
      <section className="px-4 sm:px-8 lg:px-10 pb-16">
        <div className="max-w-container mx-auto flex gap-6">
          {/* Category Filter (sidebar desktop / chips mobile) */}
          <CategoryFilter
            selected={selectedCategory}
            onSelect={handleCategorySelect}
            counts={categoryCounts}
          />

          {/* Document Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <DocumentSkeletonGrid />
            ) : isError ? (
              <ErrorState message={isError} onRetry={fetchDocuments} />
            ) : filteredDocuments.length === 0 ? (
              <EmptyState />
            ) : (
              <div
                className="grid gap-4 sm:gap-5"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                }}
              >
                {filteredDocuments.map((doc, i) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    index={i}
                    onCategoryChange={handleCategoryChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile FAB */}
      <MobileUploadFAB onFileSelect={handleFileSelect} />
    </motion.div>
  );
}
