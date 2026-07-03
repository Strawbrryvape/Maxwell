import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface UploadZoneProps {
  onFileSelect?: (files: FileList) => void;
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dropped, setDropped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDropped(true);
    setTimeout(() => setDropped(false), 500);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect?.(e.dataTransfer.files);
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect?.(e.target.files);
    }
  }, [onFileSelect]);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: easeOut, delay: 0.25 }}
    >
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className="relative w-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
        style={{
          height: '200px',
          borderRadius: '16px',
          border: isDragging
            ? '2px solid var(--maxwell-primary)'
            : '2px dashed var(--maxwell-border)',
          backgroundColor: isDragging
            ? 'var(--maxwell-primary-light)'
            : dropped
              ? 'var(--maxwell-primary-light)'
              : 'var(--maxwell-surface)',
          boxShadow: isDragging ? 'var(--shadow-upload)' : 'var(--shadow-md)',
          animation: isDragging ? 'pulse-border 1.2s ease-in-out infinite' : 'none',
        }}
        animate={{
          scale: dropped ? [1, 0.99, 1] : isDragging ? 1.01 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.heic,.tiff,.tif"
          onChange={handleFileInput}
          className="hidden"
        />

        <Upload
          size={40}
          style={{
            color: isDragging ? 'var(--maxwell-primary)' : 'var(--maxwell-text-tertiary)',
          }}
          className="mb-3 transition-colors duration-150"
        />

        <p
          className="font-medium text-sm"
          style={{
            color: isDragging ? 'var(--maxwell-primary)' : 'var(--maxwell-text-secondary)',
          }}
        >
          {isDragging ? 'Drop your documents here' : 'Drop your documents here'}
        </p>

        <p
          className="mt-1"
          style={{
            fontSize: '12px',
            color: 'var(--maxwell-text-tertiary)',
          }}
        >
          PDF, PNG, JPG, HEIC, TIFF — up to 50MB
        </p>
      </motion.div>
    </motion.div>
  );
}
