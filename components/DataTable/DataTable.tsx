'use client';

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Checkbox, ConfirmModal, ModalSelect } from '@/components/ui';
import { exportToCsv, exportToExcel, exportToPdf, rowsToExportMatrix } from './export';
import type { DataTableColumn, DataTableProps } from './types';

function cellText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return String(value);
}

function getExportCell<T>(column: DataTableColumn<T>, row: T): string {
  if (column.exportValue) {
    const v = column.exportValue(row);
    return v == null ? '' : String(v);
  }
  return cellText(column.accessor(row));
}

export default function DataTable<T>({
  data,
  columns,
  getRowId,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Search…',
  filterable = true,
  exportable = true,
  exportFilename = 'export',
  selectable,
  onDeleteSelected,
  deleteLabel = 'Delete selected',
  getDeleteConfirmMessage,
  onRowClick,
  emptyTitle = 'No results',
  emptyDescription,
  emptyAction,
  footer,
}: DataTableProps<T>) {
  const selectionEnabled = selectable ?? Boolean(onDeleteSelected);

  const [search, setSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [exportFormat, setExportFormat] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const filterableColumns = useMemo(
    () => columns.filter((c) => filterable && c.filterable === true),
    [columns, filterable]
  );

  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of filterableColumns) {
      const values = new Set<string>();
      for (const row of data) {
        const text = cellText(col.accessor(row)).trim();
        if (text) values.add(text);
      }
      map[col.id] = Array.from(values).sort((a, b) => a.localeCompare(b));
    }
    return map;
  }, [data, filterableColumns]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      for (const col of filterableColumns) {
        const selected = columnFilters[col.id];
        if (selected && cellText(col.accessor(row)) !== selected) {
          return false;
        }
      }
      if (!q || !searchable) return true;
      return columns.some((col) => {
        if (col.searchable === false) return false;
        return cellText(col.accessor(row)).toLowerCase().includes(q);
      });
    });
  }, [data, search, searchable, columns, filterableColumns, columnFilters]);

  useEffect(() => {
    const visible = new Set(filteredRows.map(getRowId));
    setSelectedIds((prev) => {
      const next = new Set<string | number>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next;
    });
  }, [filteredRows, getRowId]);

  const allVisibleSelected =
    filteredRows.length > 0 && filteredRows.every((row) => selectedIds.has(getRowId(row)));
  const someVisibleSelected =
    filteredRows.some((row) => selectedIds.has(getRowId(row))) && !allVisibleSelected;

  const selectedRows = useMemo(
    () => filteredRows.filter((row) => selectedIds.has(getRowId(row))),
    [filteredRows, selectedIds, getRowId]
  );

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredRows.map(getRowId)));
  };

  const toggleRow = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildExportMatrix = () => {
    const headers = columns.map((c) => c.header);
    const body = filteredRows.map((row) => columns.map((col) => getExportCell(col, row)));
    return rowsToExportMatrix(headers, body);
  };

  const handleExportPick = (format: string) => {
    setExportFormat('');
    if (!format) return;
    const { headers, body } = buildExportMatrix();
    if (format === 'csv') exportToCsv(exportFilename, headers, body);
    else if (format === 'excel') exportToExcel(exportFilename, headers, body);
    else if (format === 'pdf') exportToPdf(exportFilename, headers, body);
  };

  const deleteConfirmMessage =
    selectedRows.length === 0
      ? ''
      : getDeleteConfirmMessage?.(selectedRows) ??
        `Delete ${selectedRows.length} selected item${selectedRows.length === 1 ? '' : 's'}? This cannot be undone.`;

  const handleDelete = async () => {
    if (!onDeleteSelected || selectedRows.length === 0) return;
    setDeleting(true);
    try {
      await onDeleteSelected(selectedRows);
      setSelectedIds(new Set());
      setDeleteConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const onRowKeyDown = (row: T, e: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onRowClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(row);
    }
  };

  const activeFilterCount = Object.values(columnFilters).filter(Boolean).length;
  const showToolbar =
    searchable || filterableColumns.length > 0 || exportable || (selectionEnabled && selectedRows.length > 0);

  return (
    <div className="space-y-3">
      {showToolbar && (
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border border-gray-200 rounded-lg px-3 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {searchable && (
              <div className="relative flex-1 min-w-[14rem] max-w-md">
                <label htmlFor="data-table-search" className="sr-only">
                  Search
                </label>
                <input
                  id="data-table-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="block w-full min-h-[44px] pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin text-sm bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            )}

            {filterableColumns.map((col) => (
              <ModalSelect
                key={col.id}
                className="w-[11rem] shrink-0"
                label={col.header}
                placeholder={`All ${col.header}`}
                value={columnFilters[col.id] || ''}
                onChange={(v) =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    [col.id]: v,
                  }))
                }
                options={[
                  { value: '', label: `All ${col.header}` },
                  ...(filterOptions[col.id] || []).map((opt) => ({
                    value: opt,
                    label: opt,
                  })),
                ]}
              />
            ))}

            {(search || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setColumnFilters({});
                }}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-white bg-white shrink-0 min-h-[44px]"
              >
                Clear
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2 ml-auto shrink-0">
              {selectionEnabled && selectedRows.length > 0 && onDeleteSelected && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-3 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
                >
                  {deleting ? 'Deleting…' : `${deleteLabel} (${selectedRows.length})`}
                </button>
              )}

              {exportable && (
                <ModalSelect
                  className="w-[8.5rem]"
                  label="Export"
                  placeholder="Export"
                  value={exportFormat}
                  onChange={handleExportPick}
                  searchThreshold={5}
                  options={[
                    { value: 'csv', label: 'CSV' },
                    { value: 'excel', label: 'Excel' },
                    { value: 'pdf', label: 'PDF' },
                  ]}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin" />
          <p className="mt-4 text-sm text-gray-600">Loading…</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-900 font-medium">{emptyTitle}</p>
          {emptyDescription && <p className="mt-2 text-sm text-gray-600">{emptyDescription}</p>}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {selectionEnabled && (
                    <th className="px-2 py-2 w-14">
                      <Checkbox
                        id="data-table-select-all"
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onChange={toggleAll}
                        aria-label="Select all"
                        size="sm"
                      />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className={
                        col.headerClassName ||
                        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      }
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRows.map((row) => {
                  const id = getRowId(row);
                  const selected = selectedIds.has(id);
                  return (
                    <tr
                      key={String(id)}
                      role={onRowClick ? 'link' : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={onRowClick ? (e) => onRowKeyDown(row, e) : undefined}
                      className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${
                        selected ? 'bg-admin/5' : ''
                      }`}
                    >
                      {selectionEnabled && (
                        <td className="px-2 py-2 w-14" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected}
                            onChange={() => toggleRow(id)}
                            aria-label="Select row"
                            size="sm"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.id} className={col.className || 'px-6 py-4 text-gray-700'}>
                          {col.cell ? col.cell(row) : cellText(col.accessor(row)) || '-'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {footer}
        </>
      )}

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => {
          if (!deleting) setDeleteConfirmOpen(false);
        }}
        onConfirm={handleDelete}
        title="Delete selected"
        description="This cannot be undone."
        confirmLabel={deleteLabel}
        variant="danger"
        busy={deleting}
      >
        <p className="text-sm text-gray-700">{deleteConfirmMessage}</p>
      </ConfirmModal>
    </div>
  );
}
