'use client';

import type { ReactNode } from 'react';
import Modal from './Modal';

export type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  busy?: boolean;
};

/**
 * Confirm / cancel dialog built on Modal.
 * Footer actions are right-aligned (Cancel, then primary/danger).
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  busy = false,
}: ConfirmModalProps) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
      : 'bg-admin hover:bg-admin-600 focus:ring-admin';

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={title}
      description={description}
      compact
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void onConfirm();
            }}
            className={`min-h-[44px] px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      {children ?? (
        <p className="text-sm text-gray-600">
          Please confirm you want to continue.
        </p>
      )}
    </Modal>
  );
}
