'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'default';
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'default',
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Auto-focus cancel button
      if (cancelButtonRef.current) {
        cancelButtonRef.current.focus();
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const confirmButtonStyles = 
    confirmVariant === 'danger'
      ? 'bg-[var(--color-red)] text-[var(--color-bg)] hover:bg-[var(--color-red-hover)] px-4 py-2 text-[13px] font-medium transition-colors'
      : 'bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] px-4 py-2 text-[13px] font-medium transition-colors';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 max-w-md w-full mx-4">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">{title}</h2>
        <p className="text-[13px] text-[var(--color-muted)] mt-2">{description}</p>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="px-4 py-2 text-[13px] font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-text)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={confirmButtonStyles}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}