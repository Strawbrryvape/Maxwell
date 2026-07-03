import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Camera, Image, FolderOpen, X } from 'lucide-react';

const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title = 'Upload a document', children }: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 120) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70]"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[71] flex flex-col"
            style={{
              backgroundColor: 'var(--maxwell-surface)',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: easeSpring }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: 'var(--maxwell-border)' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h3
                className="font-semibold text-base"
                style={{ color: 'var(--maxwell-text-primary)' }}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                style={{ color: 'var(--maxwell-text-secondary)' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div ref={contentRef} className="px-6 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface UploadBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption?: (option: 'camera' | 'gallery' | 'files') => void;
}

export function UploadBottomSheet({ isOpen, onClose, onSelectOption }: UploadBottomSheetProps) {
  const options = [
    { id: 'camera' as const, label: 'Take a photo', icon: Camera },
    { id: 'gallery' as const, label: 'Choose from gallery', icon: Image },
    { id: 'files' as const, label: 'Browse files', icon: FolderOpen },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Upload a document">
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              onSelectOption?.(option.id);
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-xl transition-colors text-left hover:bg-[var(--maxwell-primary-light)]"
            style={{ backgroundColor: 'var(--maxwell-background)' }}
          >
            <option.icon size={22} style={{ color: 'var(--maxwell-primary)' }} />
            <span
              className="font-medium text-sm"
              style={{ color: 'var(--maxwell-text-secondary)' }}
            >
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
