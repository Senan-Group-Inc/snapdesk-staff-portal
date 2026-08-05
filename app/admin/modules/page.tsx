'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasAnyStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import productModuleService from '@/services/product-module.service';
import {
  ProductModule,
  CreateProductModuleRequest,
  UpdateProductModuleRequest,
} from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';

const emptyCreate: CreateProductModuleRequest = {
  key: '',
  label: '',
  description: '',
  monthly_price: '0.00',
  sort_order: 0,
  is_active: true,
};

export default function ProductModulesPage() {
  const { user } = useStaffAuth();
  const canView = hasAnyStaffPermission(user, [
    STAFF_PERMISSIONS.VIEW_PRODUCT_MODULES,
    STAFF_PERMISSIONS.MANAGE_ORGANISATIONS,
  ]);
  const canMutate = hasAnyStaffPermission(user, [
    STAFF_PERMISSIONS.MANAGE_PRODUCT_MODULES,
    STAFF_PERMISSIONS.MANAGE_ORGANISATIONS,
  ]);

  const [rows, setRows] = useState<ProductModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ProductModule | null>(null);
  const [form, setForm] = useState<CreateProductModuleRequest & UpdateProductModuleRequest>(emptyCreate);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productModuleService.listProductModules();
      const sorted = [...res.data].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.key.localeCompare(b.key);
      });
      setRows(sorted);
    } catch (e: unknown) {
      toast.error(handleApiError(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) load();
    else setIsLoading(false);
  }, [canView, load]);

  const openCreate = () => {
    setForm({ ...emptyCreate });
    setEditing(null);
    setModal('create');
  };

  const openEdit = (m: ProductModule) => {
    setEditing(m);
    setForm({
      key: m.key,
      label: m.label,
      description: m.description ?? '',
      monthly_price: m.monthly_price,
      sort_order: m.sort_order,
      is_active: m.is_active,
    });
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (modal === 'create') {
      if (!form.key?.trim()) {
        toast.error('Module key is required (must match a backend module key).');
        return;
      }
    }
    setSaving(true);
    try {
      if (modal === 'create') {
        const payload: CreateProductModuleRequest = {
          key: form.key.trim(),
          label: form.label || undefined,
          description: form.description || null,
          monthly_price: form.monthly_price,
          sort_order: form.sort_order ?? 0,
          is_active: form.is_active ?? true,
        };
        await productModuleService.createProductModule(payload);
        toast.success('Module row created.');
      } else if (modal === 'edit' && editing) {
        const payload: UpdateProductModuleRequest = {
          label: form.label,
          description: form.description || null,
          monthly_price: form.monthly_price,
          sort_order: form.sort_order,
          is_active: form.is_active,
        };
        await productModuleService.updateProductModule(editing.id, payload);
        toast.success('Module updated.');
      }
      closeModal();
      await load();
    } catch (e: unknown) {
      toast.error(handleApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = async (selected: ProductModule[]) => {
    try {
      await Promise.all(selected.map((m) => productModuleService.deleteProductModule(m.id)));
      toast.success(`Removed ${selected.length} catalog row${selected.length === 1 ? '' : 's'}.`);
      await load();
    } catch (e: unknown) {
      toast.error(handleApiError(e));
      await load();
    }
  };

  const columns = useMemo<DataTableColumn<ProductModule>[]>(
    () => [
      {
        id: 'key',
        header: 'Key',
        accessor: (m) => m.key,
        className: 'px-4 py-3 font-mono text-gray-900',
      },
      {
        id: 'label',
        header: 'Label',
        accessor: (m) => m.label,
      },
      {
        id: 'price',
        header: 'Price / mo',
        accessor: (m) => m.monthly_price,
      },
      {
        id: 'order',
        header: 'Order',
        accessor: (m) => String(m.sort_order),
      },
      {
        id: 'active',
        header: 'Active',
        accessor: (m) => (m.is_active ? 'Yes' : 'No'),
        filterable: true,
        cell: (m) => (
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
              m.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {m.is_active ? 'Yes' : 'No'}
          </span>
        ),
      },
      ...(canMutate
        ? [
            {
              id: 'actions',
              header: 'Actions',
              accessor: () => '',
              searchable: false,
              filterable: false,
              headerClassName:
                'px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
              className: 'px-4 py-3 text-right whitespace-nowrap',
              cell: (m: ProductModule) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(m);
                  }}
                  className="text-admin hover:text-admin-600 font-medium"
                >
                  Edit
                </button>
              ),
            } satisfies DataTableColumn<ProductModule>,
          ]
        : []),
    ],
    [canMutate]
  );

  const addButton = canMutate ? (
    <button
      type="button"
      onClick={openCreate}
      className="px-4 py-2.5 bg-admin text-white rounded-lg hover:bg-admin-600 transition-colors font-medium text-sm min-h-[44px]"
    >
      + Add catalog row
    </button>
  ) : null;

  if (!canView) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-900">Product modules</h1>
            <p className="mt-2 text-gray-600">
              You do not have permission to view the product module catalog. Required:{' '}
              <code className="text-sm bg-gray-100 px-1 rounded">view_product_modules</code> or legacy{' '}
              <code className="text-sm bg-gray-100 px-1 rounded">manage_organisations</code>.
            </p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product modules</h1>
              <p className="mt-2 text-sm text-gray-600">
                Global catalog: labels, monthly price, sort order, and availability for tenant module pickers.
              </p>
            </div>
            {addButton}
          </div>

          <DataTable
            data={rows}
            columns={columns}
            getRowId={(m) => m.id}
            isLoading={isLoading}
            searchPlaceholder="Search modules…"
            exportFilename="product-modules"
            selectable={canMutate}
            onDeleteSelected={canMutate ? handleDeleteSelected : undefined}
            deleteLabel="Remove selected"
            getDeleteConfirmMessage={(selected) =>
              `Remove ${selected.length} catalog row${selected.length === 1 ? '' : 's'}? The API falls back to code defaults until re-seeded.`
            }
            onRowClick={canMutate ? openEdit : undefined}
            emptyTitle="No catalog rows yet"
            emptyDescription="Add rows for keys defined in the backend."
            emptyAction={addButton}
          />

          {modal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
              <div className="bg-white rounded-lg border border-gray-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {modal === 'create' ? 'Add catalog row' : 'Edit catalog row'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {modal === 'create'
                    ? 'The key must already exist in backend ALL_MODULE_KEYS.'
                    : 'The key cannot be changed; update pricing and display fields.'}
                </p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                    <input
                      type="text"
                      disabled={modal === 'edit'}
                      value={form.key ?? ''}
                      onChange={(e) => setForm({ ...form, key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin disabled:bg-gray-100 font-mono text-sm"
                      placeholder="e.g. pm, hr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={form.label ?? ''}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={form.description ?? ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly price</label>
                      <input
                        type="text"
                        value={form.monthly_price ?? ''}
                        onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                      <input
                        type="number"
                        value={form.sort_order ?? 0}
                        onChange={(e) =>
                          setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-admin focus:ring-admin"
                    />
                    <span className="text-sm text-gray-700">Active (shown in pickers)</span>
                  </label>
                </div>
                <div className="mt-8 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving || !canMutate}
                    onClick={handleSubmit}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50 min-h-[44px]"
                  >
                    {saving ? 'Saving…' : modal === 'create' ? 'Create' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
