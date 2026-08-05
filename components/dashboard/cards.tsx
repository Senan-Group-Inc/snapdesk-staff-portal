'use client';

import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 transition-all duration-200 hover:border-admin/20">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function HubCard({
  href,
  title,
  description,
  status,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  status?: string;
  icon: IconType;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-lg border border-gray-200 p-5 hover:border-admin/40 hover:bg-gray-50/50 transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-admin/10 text-admin shrink-0">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-admin truncate">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <svg
          className="w-5 h-5 text-gray-400 group-hover:text-admin shrink-0 mt-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {status && (
        <div className="mt-4">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        </div>
      )}
    </Link>
  );
}
