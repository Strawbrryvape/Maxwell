import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
  fileName: string;
}

type ZoomLevel = 0.75 | 1 | 1.25 | 1.5;
const ZOOM_LEVELS: ZoomLevel[] = [0.75, 1, 1.25, 1.5];

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export default function PDFViewer({ pdfUrl, fileName }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(1);
  const totalPages = 4;

  const zoom = ZOOM_LEVELS[zoomIndex];
  const zoomPercent = Math.round(zoom * 100);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFit = useCallback(() => {
    setZoomIndex(1);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* PDF Content Area */}
      <div
        className="flex-1 overflow-auto relative"
        style={{ backgroundColor: 'var(--maxwell-border-subtle)' }}
      >
        <div className="absolute inset-0 flex items-start justify-center py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15, ease: easeOut }}
              className="flex items-start justify-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 200ms ease',
              }}
            >
              <iframe
                src={`${pdfUrl}#page=${currentPage}&view=FitH`}
                title={fileName}
                className="border-0 shadow-lg"
                style={{
                  width: 'min(800px, 90vw)',
                  height: 'calc(100vh - 280px)',
                  minHeight: '500px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Side Navigation Arrows */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-fast disabled:opacity-30 hover:scale-105"
          style={{
            backgroundColor: 'var(--maxwell-surface)',
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--maxwell-text-secondary)',
          }}
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-fast disabled:opacity-30 hover:scale-105"
          style={{
            backgroundColor: 'var(--maxwell-surface)',
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--maxwell-text-secondary)',
          }}
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className="flex items-center justify-between py-3 px-4 border-t"
        style={{
          backgroundColor: 'var(--maxwell-surface)',
          borderColor: 'var(--maxwell-border-subtle)',
        }}
      >
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-fast disabled:opacity-30 hover:bg-[var(--maxwell-border-subtle)]"
            style={{ color: 'var(--maxwell-text-secondary)' }}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <span
            className="text-xs font-medium min-w-[80px] text-center tabular-nums"
            style={{ color: 'var(--maxwell-text-secondary)' }}
          >
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-fast disabled:opacity-30 hover:bg-[var(--maxwell-border-subtle)]"
            style={{ color: 'var(--maxwell-text-secondary)' }}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-fast disabled:opacity-30 hover:bg-[var(--maxwell-border-subtle)]"
            style={{ color: 'var(--maxwell-text-secondary)' }}
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <span
            className="text-xs font-medium min-w-[40px] text-center tabular-nums"
            style={{ color: 'var(--maxwell-text-secondary)' }}
          >
            {zoomPercent}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-fast disabled:opacity-30 hover:bg-[var(--maxwell-border-subtle)]"
            style={{ color: 'var(--maxwell-text-secondary)' }}
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <div
            className="w-px h-4 mx-1"
            style={{ backgroundColor: 'var(--maxwell-border-subtle)' }}
          />

          <button
            onClick={handleFit}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-fast hover:bg-[var(--maxwell-border-subtle)]"
            style={{ color: 'var(--maxwell-text-secondary)' }}
            aria-label="Fit to view"
            title="Fit to view"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
