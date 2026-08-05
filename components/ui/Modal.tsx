'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  description?: string;
  /** Shorter body for confirm dialogs (default content pickers keep the taller body). */
  compact?: boolean;
};

/**
 * Full-viewport overlay dialog portaled to document.body.
 * Centered on md+, bottom sheet on small screens.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  compact = false,
}: ModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      const t = window.setTimeout(() => setRendered(false), 180);
      return () => window.clearTimeout(t);
    }
    setRendered(true);
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!rendered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [rendered, onClose]);

  if (!mounted || !rendered) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 md:items-center md:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className={`absolute inset-0 bg-gray-900/50 transition-opacity duration-200 ease-out ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-[101] flex w-full max-h-[88vh] flex-col bg-white
          rounded-t-2xl border border-gray-200
          md:max-w-lg md:rounded-xl md:max-h-[80vh]
          transition-all duration-200 ease-out
          ${
            entered
              ? 'opacity-100 translate-y-0 md:scale-100'
              : 'opacity-0 translate-y-4 md:translate-y-2 md:scale-[0.98]'
          }`}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <span className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        <div className="px-6 pt-4 md:pt-6 pb-4 border-b border-gray-200 shrink-0">
          <h2 id={titleId} className="text-xl font-semibold text-gray-900 tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-1.5 text-sm text-gray-600">{description}</p>}
        </div>

        <div
          className={`px-6 py-4 overflow-y-auto flex-1 ${compact ? 'min-h-0' : 'min-h-[12rem]'}`}
        >
          {children}
        </div>

        {footer != null && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0 bg-white rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
