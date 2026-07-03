import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, X } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';
import ImageViewer from '@/components/ImageViewer';
import MetadataPanel from '@/components/MetadataPanel';
import Toast, { useToast } from '@/components/Toast';
import { getDocument, updateDocumentCategory, deleteDocument, adaptDocumentDetail } from '@/lib/api';
import type { DemoDocument, DocumentCategory } from '@/data/demoDocuments';

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];
const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

type ViewMode = 'desktop' | 'tablet' | 'mobile';

function useViewMode(): ViewMode {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setViewMode('mobile');
      else if (w < 1024) setViewMode('tablet');
      else setViewMode('desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return viewMode;
}

/**
 * Skeleton loader for document detail.
 */
function DetailSkeleton() {
  return (
    <div
      className="h-[calc(100dvh-64px)] flex overflow-hidden"
      style={{ backgroundColor: 'var(--maxwell-surface)' }}
    >
      <div className="w-[60%] h-full animate-pulse" style={{ backgroundColor: 'var(--maxwell-border-subtle)' }} />
      <div className="w-[40%] max-w-[420px] p-6 space-y-6">
        <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--maxwell-border)', width: '30%' }} />
        <div className="h-8 rounded animate-pulse" style={{ backgroundColor: 'var(--maxwell-border)' }} />
        <div className="h-6 rounded animate-pulse" style={{ backgroundColor: 'var(--maxwell-border-subtle)', width: '50%' }} />
        <div className="space-y-3 mt-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded animate-pulse" style={{ backgroundColor: 'var(--maxwell-border-subtle)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const viewMode = useViewMode();
  const { toasts, addToast, dismissToast } = useToast();

  const [activeDoc, setActiveDoc] = useState<DemoDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);

  // Load document from API
  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;

    async function loadDocument() {
      setIsLoading(true);
      try {
        const doc = await getDocument(id!);
        if (!cancelled) {
          setActiveDoc(adaptDocumentDetail(doc));
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load document';
          addToast(message, 'error');
          navigate('/', { replace: true });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, addToast]);

  const handleCategoryChange = useCallback(
    async (category: DocumentCategory) => {
      if (!id || !activeDoc) return;

      // Optimistic update
      setActiveDoc((prev) => (prev ? { ...prev, category } : prev));

      try {
        await updateDocumentCategory(id, category);
        addToast(`Category updated to ${category}`, 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update category';
        addToast(message, 'error');
        // Revert
        if (id) {
          try {
            const doc = await getDocument(id);
            setActiveDoc(adaptDocumentDetail(doc));
          } catch {
            // ignore
          }
        }
      }
    },
    [id, activeDoc, addToast]
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;

    try {
      await deleteDocument(id);
      addToast('Document deleted', 'success');
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      addToast(message, 'error');
    }
  }, [id, addToast, navigate]);

  const handleDownload = useCallback(() => {
    if (!activeDoc?.thumbnail || activeDoc.thumbnail === '/og-image.png') {
      addToast('Download link not available', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = activeDoc.thumbnail;
    a.download = activeDoc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [activeDoc, addToast]);

  // Redirect if document not found
  useEffect(() => {
    if (!isLoading && !activeDoc && id) {
      navigate('/', { replace: true });
    }
  }, [activeDoc, isLoading, id, navigate]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!activeDoc) {
    return null;
  }

  const fileType = activeDoc.fileType || 'image';

  // Mobile bottom sheet close
  const handleMobileClose = () => {
    setMobileSheetOpen(false);
    navigate('/');
  };

  // File fallback for unsupported types
  const renderFileFallback = () => (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: 'var(--maxwell-border-subtle)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: easeSmooth }}
        className="flex flex-col items-center gap-4"
      >
        <FileText size={80} style={{ color: 'var(--maxwell-text-tertiary)' }} />
        <div className="text-center">
          <p
            className="font-medium"
            style={{ color: 'var(--maxwell-text-primary)' }}
          >
            {activeDoc.name}
          </p>
          {activeDoc.fileSize && (
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--maxwell-text-tertiary)' }}
            >
              {activeDoc.fileSize}
            </p>
          )}
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 py-2.5 px-5 rounded-lg border font-semibold text-sm transition-all duration-fast hover:scale-[1.02] active:scale-[0.98]"
          style={{
            borderColor: 'var(--maxwell-primary)',
            color: 'var(--maxwell-primary)',
          }}
        >
          <Download size={16} />
          Download to view
        </button>
      </motion.div>
    </div>
  );

  // Render document viewer based on file type
  const renderDocumentViewer = () => {
    switch (fileType) {
      case 'pdf':
        return <PDFViewer pdfUrl={activeDoc.thumbnail} fileName={activeDoc.name} />;
      case 'image':
        return <ImageViewer src={activeDoc.thumbnail} alt={activeDoc.name} />;
      default:
        return renderFileFallback();
    }
  };

  // ───────────────────── Desktop Layout (>1024px) ─────────────────────
  if (viewMode === 'desktop') {
    return (
      <motion.div
        className="h-[calc(100dvh-64px)] flex overflow-hidden"
        style={{ backgroundColor: 'var(--maxwell-surface)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: easeSmooth }}
      >
        {/* Toast notifications */}
        <Toast toasts={toasts} onDismiss={dismissToast} />

        {/* Document Preview (60%) */}
        <motion.div
          className="w-[60%] h-full border-r"
          style={{ borderColor: 'var(--maxwell-border-subtle)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: easeSmooth }}
        >
          {renderDocumentViewer()}
        </motion.div>

        {/* Metadata Panel (40%) */}
        <div className="w-[40%] h-full max-w-[420px] overflow-y-auto">
          <MetadataPanel
            document={activeDoc}
            onCategoryChange={handleCategoryChange}
            onDelete={handleDelete}
          />
        </div>
      </motion.div>
    );
  }

  // ───────────────────── Tablet Layout (640-1024px) ─────────────────────
  if (viewMode === 'tablet') {
    return (
      <motion.div
        className="min-h-[calc(100dvh-64px)] flex items-start justify-center p-4 sm:p-6"
        style={{ backgroundColor: 'var(--maxwell-background)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: easeSmooth }}
      >
        {/* Toast notifications */}
        <Toast toasts={toasts} onDismiss={dismissToast} />

        {/* Modal Overlay */}
        <motion.div
          className="w-full max-w-[900px] max-h-[85dvh] overflow-hidden border shadow-xl flex flex-col"
          style={{
            backgroundColor: 'var(--maxwell-surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
          }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: easeSpring }}
        >
          {/* Close button top-right */}
          <div className="flex justify-end p-3 border-b" style={{ borderColor: 'var(--maxwell-border-subtle)' }}>
            <Link
              to="/"
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-fast hover:bg-[var(--maxwell-border-subtle)]"
              style={{ color: 'var(--maxwell-text-secondary)' }}
              aria-label="Close"
            >
              <X size={20} />
            </Link>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Document Preview */}
            <div
              className="w-full"
              style={{
                height: '50vh',
                minHeight: '300px',
                borderBottom: '1px solid var(--maxwell-border-subtle)',
              }}
            >
              {fileType === 'image' ? (
                <ImageViewer src={activeDoc.thumbnail} alt={activeDoc.name} />
              ) : fileType === 'pdf' ? (
                <PDFViewer pdfUrl={activeDoc.thumbnail} fileName={activeDoc.name} />
              ) : (
                <div style={{ height: '100%' }}>{renderFileFallback()}</div>
              )}
            </div>

            {/* Metadata Panel */}
            <MetadataPanel
              document={activeDoc}
              onCategoryChange={handleCategoryChange}
              onDelete={handleDelete}
            />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ───────────────────── Mobile Layout (<640px) ─────────────────────
  return (
    <motion.div
      className="relative"
      style={{ height: 'calc(100dvh - 64px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
    >
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Document Preview (fills viewport behind sheet) */}
      <div className="absolute inset-0">
        {fileType === 'image' ? (
          <ImageViewer src={activeDoc.thumbnail} alt={activeDoc.name} />
        ) : fileType === 'pdf' ? (
          <PDFViewer pdfUrl={activeDoc.thumbnail} fileName={activeDoc.name} />
        ) : (
          renderFileFallback()
        )}
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {mobileSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 z-40"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleMobileClose}
            />

            {/* Sheet */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 flex flex-col"
              style={{
                backgroundColor: 'var(--maxwell-surface)',
                borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
                maxHeight: '75vh',
                boxShadow: 'var(--shadow-xl)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: easeSpring }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div
                  className="rounded-full"
                  style={{
                    width: 40,
                    height: 5,
                    backgroundColor: 'var(--maxwell-border)',
                  }}
                />
              </div>

              {/* Metadata */}
              <div className="flex-1 overflow-y-auto">
                <MetadataPanel
                  document={activeDoc}
                  onCategoryChange={handleCategoryChange}
                  onDelete={handleDelete}
                  isMobile
                  onClose={handleMobileClose}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
