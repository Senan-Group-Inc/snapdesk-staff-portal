'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Modal from './Modal';

export type ModalSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ModalSelectProps = {
  label: string;
  value: string;
  options: ModalSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Show search when options exceed this count. Default 5. */
  searchThreshold?: number;
  disabled?: boolean;
  className?: string;
  /** Empty-state inside the list. */
  emptyText?: string;
  id?: string;
  /** Show visible label above the trigger (forms). Default false (sr-only). */
  labelVisible?: boolean;
  /** Helper text under the trigger. */
  hint?: string;
  required?: boolean;
};

export default function ModalSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  searchThreshold = 5,
  disabled = false,
  className = '',
  emptyText = 'No options',
  id,
  labelVisible = false,
  hint,
  required = false,
}: ModalSelectProps) {
  const autoId = useId();
  const triggerId = id || autoId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const showSearch = options.length > searchThreshold;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => setOpen(false);

  const choose = (next: string) => {
    onChange(next);
    close();
  };

  return (
    <div className={className}>
      {labelVisible ? (
        <label htmlFor={triggerId} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      ) : (
        <label htmlFor={triggerId} className="sr-only">
          {label}
        </label>
      )}
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="w-full min-h-[44px] px-3 py-2.5 text-left text-sm border border-gray-300 rounded-lg bg-white
          hover:border-admin/40 focus:outline-none focus:ring-2 focus:ring-admin/30 focus:border-admin
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
          flex items-center justify-between gap-2 transition-colors duration-200"
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-500 truncate'}>
          {selected?.label || placeholder}
        </span>
        <svg
          className="h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}

      <Modal
        open={open}
        onClose={close}
        title={label}
        description={`Choose ${label.toLowerCase()}`}
        footer={
          <button
            type="button"
            onClick={close}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] transition-colors duration-200"
          >
            Cancel
          </button>
        }
      >
        {showSearch && (
          <div className="mb-4">
            <label
              htmlFor={`${triggerId}-search`}
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Search
            </label>
            <input
              id={`${triggerId}-search`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              autoFocus
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-admin focus:border-admin transition-shadow duration-200"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 py-10 text-center">{emptyText}</p>
        ) : (
          <ul className="space-y-1.5" role="listbox" aria-label={label}>
            {filtered.map((opt, index) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value || '__empty'}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(index, 8) * 20}ms` }}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => choose(opt.value)}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-lg text-left text-sm flex items-center justify-between gap-3 border transition-colors duration-150
                      ${
                        isSelected
                          ? 'bg-admin/10 text-admin font-medium border-admin/20'
                          : 'text-gray-800 bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <svg
                        className="h-5 w-5 text-admin shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}
