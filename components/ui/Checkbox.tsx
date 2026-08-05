'use client';

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: ReactNode;
  indeterminate?: boolean;
  size?: 'sm' | 'md';
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    indeterminate = false,
    size = 'md',
    className = '',
    id,
    disabled,
    checked,
    ...props
  },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const innerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (el) el.indeterminate = indeterminate;
  }, [indeterminate]);

  const box = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const hit = size === 'sm' ? 'min-h-[40px] min-w-[40px]' : 'min-h-[44px] min-w-[44px]';
  const showChecked = Boolean(checked) && !indeterminate;

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-2 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      } ${className}`}
    >
      <span className={`relative inline-flex items-center justify-center ${hit}`}>
        <input
          {...props}
          id={inputId}
          checked={checked}
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          type="checkbox"
          disabled={disabled}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`${box} rounded-[5px] border-2 flex items-center justify-center transition-colors
            peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-admin
            ${
              indeterminate || showChecked
                ? 'border-admin bg-admin'
                : 'border-gray-300 bg-white peer-hover:border-admin/50'
            }
            peer-disabled:border-gray-200 peer-disabled:bg-gray-100`}
        >
          {indeterminate ? (
            <span className="h-0.5 w-2.5 rounded-full bg-white" />
          ) : (
            <svg
              className={`h-3 w-3 text-white transition ${showChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6.2L4.8 9 10 3" />
            </svg>
          )}
        </span>
      </span>
      {label != null && <span className="text-sm text-gray-800 select-none">{label}</span>}
    </label>
  );
});

export default Checkbox;
