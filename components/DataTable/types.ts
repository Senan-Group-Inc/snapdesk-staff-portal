import { ReactNode } from 'react';

export type DataTableColumn<T> = {
  id: string;
  header: string;
  /** Value used for search, column filters, sorting, and default export cells. */
  accessor: (row: T) => unknown;
  /** Optional custom cell render. Falls back to stringified accessor. */
  cell?: (row: T) => ReactNode;
  /** Include in global search. Default true. */
  searchable?: boolean;
  /** Show a distinct-value filter dropdown. Default false (opt-in). */
  filterable?: boolean;
  /** Value written to export files. Defaults to accessor. */
  exportValue?: (row: T) => string | number | boolean | null | undefined;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string | number;
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  exportable?: boolean;
  exportFilename?: string;
  /** Enables checkboxes. Defaults to true when onDeleteSelected is set. */
  selectable?: boolean;
  onDeleteSelected?: (rows: T[]) => void | Promise<void>;
  deleteLabel?: string;
  getDeleteConfirmMessage?: (rows: T[]) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Optional pagination footer under the table. */
  footer?: ReactNode;
};
