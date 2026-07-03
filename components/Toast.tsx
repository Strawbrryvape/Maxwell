import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

const variantStyles: Record<ToastVariant, { borderLeft: string; icon: React.ReactNode }> = {
  success: {
    borderLeft: '3px solid var(--maxwell-secondary)',
    icon: <CheckCircle size={18} style={{ color: 'var(--maxwell-secondary)' }} />,
  },
  error: {
    borderLeft: '3px solid var(--maxwell-danger)',
    icon: <AlertCircle size={18} style={{ color: 'var(--maxwell-danger)' }} />,
  },
  info: {
    borderLeft: '3px solid var(--maxwell-primary)',
    icon: <Info size={18} style={{ color: 'var(--maxwell-primary)' }} />,
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const style = variantStyles[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      className="flex items-start gap-3 px-5 py-3 rounded-lg pointer-events-auto"
      style={{
        backgroundColor: 'var(--maxwell-text-primary)',
        color: '#FFFFFF',
        boxShadow: 'var(--shadow-toast)',
        maxWidth: '400px',
        borderLeft: style.borderLeft,
        paddingLeft: '12px',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: easeSpring }}
    >
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-[80] flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for toast management
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
