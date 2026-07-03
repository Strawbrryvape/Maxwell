import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function DeleteConfirmDialog({ open, onOpenChange, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[400px] gap-5"
        style={{
          backgroundColor: 'var(--maxwell-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: easeSpring }}
            >
              <DialogHeader className="flex flex-col items-center text-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: easeSpring, delay: 0.05 }}
                >
                  <AlertCircle size={48} style={{ color: 'var(--maxwell-danger)' }} />
                </motion.div>
                <DialogTitle
                  style={{
                    color: 'var(--maxwell-text-primary)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Delete this document?
                </DialogTitle>
                <DialogDescription
                  style={{
                    color: 'var(--maxwell-text-secondary)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}
                >
                  This will remove the document and all extracted data. This can't be undone.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto"
                  style={{
                    borderColor: 'var(--maxwell-border)',
                    color: 'var(--maxwell-text-secondary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Cancel
                </Button>
                <motion.div className="w-full sm:w-auto" whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="destructive"
                    onClick={onConfirm}
                    className="w-full sm:w-auto"
                    style={{
                      backgroundColor: 'var(--maxwell-danger)',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    Delete
                  </Button>
                </motion.div>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
