'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffService from '@/services/staff.service';
import { StaffPermissionList } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function StaffPermissionsPage() {
  const router = useRouter();
  const { user } = useStaffAuth();
  const canViewPermissions = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF_PERMISSIONS);
  const canCreatePermissions = hasStaffPermission(user, STAFF_PERMISSIONS.CREATE_STAFF_PERMISSIONS);
  const canUpdatePermissions = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_STAFF_PERMISSIONS);
  const canDeletePermissions = hasStaffPermission(user, STAFF_PERMISSIONS.DELETE_STAFF_PERMISSIONS);
  const [permissions, setPermissions] = useState<StaffPermissionList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await staffService.listPermissions({ page: 1, count: 500 });
      setPermissions(response.data);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewPermissions) fetchPermissions();
    else setIsLoading(false);
  }, [canViewPermissions, fetchPermissions]);

  const columns = useMemo<DataTableColumn<StaffPermissionList>[]>(
    () => [
      {
        id: 'name',
        header: 'Permission Name',
        accessor: (p) => p.name,
        cell: (p) => <span className="font-medium text-gray-900">{p.name}</span>,
      },
      {
        id: 'description',
        header: 'Description',
        accessor: (p) => p.description || '',
        cell: (p) => p.description || <span className="text-gray-400">No description</span>,
      },
      {
        id: 'created',
        header: 'Created',
        accessor: (p) => new Date(p.created).toLocaleDateString(),
      },
      ...(canUpdatePermissions
        ? [
            {
              id: 'actions',
              header: 'Actions',
              accessor: () => '',
              searchable: false,
              filterable: false,
              headerClassName:
                'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
              className: 'px-6 py-4 text-right',
              cell: (p: StaffPermissionList) => (
                <Link
                  href={`/admin/staff/permissions/${p.id}/edit`}
                  className="text-admin hover:text-admin-600 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Edit
                </Link>
              ),
            } satisfies DataTableColumn<StaffPermissionList>,
          ]
        : []),
    ],
    [canUpdatePermissions]
  );

  const handleDeleteSelected = async (rows: StaffPermissionList[]) => {
    try {
      await Promise.all(rows.map((p) => staffService.deletePermission(p.id)));
      toast.success(`Deleted ${rows.length} permission${rows.length === 1 ? '' : 's'}.`);
      await fetchPermissions();
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      await fetchPermissions();
    }
  };

  const createButton = canCreatePermissions ? (
    <Link
      href="/admin/staff/permissions/new"
      className="px-4 py-2.5 bg-admin text-white rounded-lg hover:bg-admin-600 transition-colors font-medium text-sm min-h-[44px] inline-flex items-center"
    >
      + Create Permission
    </Link>
  ) : null;

  if (!canViewPermissions) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-sm text-gray-500">
                You don&apos;t have permission to view staff permissions.
              </p>
            </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Staff Permissions</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage permissions that can be assigned to staff roles
              </p>
            </div>
            {createButton}
          </div>

          <DataTable
            data={permissions}
            columns={columns}
            getRowId={(p) => p.id}
            isLoading={isLoading}
            searchPlaceholder="Search permissions…"
            exportFilename="staff-permissions"
            selectable={canDeletePermissions}
            onDeleteSelected={canDeletePermissions ? handleDeleteSelected : undefined}
            onRowClick={
              canUpdatePermissions
                ? (p) => router.push(`/admin/staff/permissions/${p.id}/edit`)
                : undefined
            }
            emptyTitle="No permissions found"
            emptyDescription="Create a permission to assign it to staff roles."
            emptyAction={createButton}
          />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
