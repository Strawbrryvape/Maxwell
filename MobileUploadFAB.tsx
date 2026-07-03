import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { UploadBottomSheet } from './BottomSheet';

const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

interface MobileUploadFABProps {
  onFileSelect?: (files: FileList | null) => void;
}

export default function MobileUploadFAB({ onFileSelect }: MobileUploadFABProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const handleOptionSelect = useCallback((option: 'camera' | 'gallery' | 'files') => {
    setSheetOpen(false);
    // Small delay to let the bottom sheet close before opening file picker
    setTimeout(() => {
      if (option === 'camera') {
        cameraInputRef.current?.click();
      } else if (option === 'gallery') {
        galleryInputRef.current?.click();
      } else if (option === 'files') {
        filesInputRef.current?.click();
      }
    }, 300);
  }, []);

  const handleFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect?.(e.target.files);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [onFileSelect]);

  return (
    <>
      {/* Hidden file inputs for each upload option */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={filesInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      <motion.button
        className="lg:hidden fixed z-50 flex items-center justify-center rounded-full"
        style={{
          width: '56px',
          height: '56px',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--maxwell-primary)',
          boxShadow: 'var(--shadow-lg)',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: easeSpring, delay: 0.5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSheetOpen(true)}
        aria-label="Upload document"
      >
        <Plus size={24} color="white" />
      </motion.button>

      <UploadBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelectOption={handleOptionSelect}
      />
    </>
  );
}
