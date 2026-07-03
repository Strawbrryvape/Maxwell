import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
}

type ZoomLevel = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
const ZOOM_LEVELS: ZoomLevel[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function ImageViewer({ src, alt }: ImageViewerProps) {
  const [zoomIndex, setZoomIndex] = useState(2); // start at 1x
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];

  const handleZoomIn = useCallback(() => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
    if (zoomIndex <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoomIndex]);

  const handleFit = useCallback(() => {
    setZoomIndex(2);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
    } else {
      setZoomIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        if (next <= 1) {
          setPosition({ x: 0, y: 0 });
        }
        return next;
      });
    }
  }, []);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Image container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: 'var(--maxwell-border-subtle)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 200ms ease',
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            draggable={false}
          />
        </div>
      </div>

      {/* Zoom controls */}
      <div
        className="flex items-center justify-center gap-2 py-3 px-4 border-t"
        style={{
          backgroundColor: 'var(--maxwell-surface)',
          borderColor: 'var(--maxwell-border-subtle)',
        }}
      >
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
          className="text-xs font-medium min-w-[48px] text-center tabular-nums"
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
  );
}
