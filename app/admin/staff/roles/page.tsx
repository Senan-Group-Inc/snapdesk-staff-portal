'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffService from '@/services/staff.service';
import { StaffRoleList } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function StaffRolesPage() {
  const router = useRouter();
  const { user } = useStaffAuth();
  const canViewRoles = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF_ROLES);
  const canCreateRoles = hasStaffPermission(user, STAFF_PERMISSIONS.CREATE_STAFF_ROLES);
  const canDeleteRoles = hasStaffPermission(user, STAFF_PERMISSIONS.DELETE_STAFF_ROLES);
  const [roles, setRoles] = useState<StaffRoleList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await staffService.listRoles({ page: 1, count: 500 });
      setRoles(response.data);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewRoles) fetchRoles();
    else setIsLoading(false);
  }, [canViewRoles, fetchRoles]);

  const columns = useMemo<DataTableColumn<StaffRoleList>[]>(
    () => [
      {
        id: 'name',
        header: 'Role Name',
        accessor: (r) => r.name,
        cell: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
      },
      {
        id: 'description',
        header: 'Description',
        accessor: (r) => r.description || '',
        cell: (r) => r.description || <span className="text-gray-400">No description</span>,
      },
      {
        id: 'glpi',
        header: 'GLPI profile',
        accessor: (r) => r.glpi_profile_name || 'None',
        filterable: true,
        cell: (r) =>
          r.glpi_profile_name ? (
            <span className="font-mono text-gray-700">{r.glpi_profile_name}</span>
          ) : (
            <span className="text-gray-400">None</span>
          ),
      },
      {
        id: 'permissions',
        header: 'Permissions',
        accessor: (r) => String(r.permissions_count),
        cell: (r) => (
          <span className="text-gray-500">
            {r.permissions_count} permission{r.permissions_count !== 1 ? 's' : ''}
          </span>
        ),
      },
      {
        id: 'staff',
        header: 'Staff Members',
        accessor: (r) => String(r.staff_count),
        cell: (r) => (
          <span className="text-gray-500">
            {r.staff_count} member{r.staff_count !== 1 ? 's' : ''}
          </span>
        ),
      },
    ],
    []
  );

  const handleDeleteSelected = async (rows: StaffRoleList[]) => {
    try {
      await Promise.all(rows.map((r) => staffService.deleteRole(r.id)));
      toast.success(`Deleted ${rows.length} role${rows.length === 1 ? '' : 's'}.`);
      await fetchRoles();
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      await fetchRoles();
    }
  };

  const createButton = canCreateRoles ? (
    <Link
      href="/admin/staff/roles/new"
      className="px-4 py-2.5 bg-admin text-white rounded-lg hover:bg-admin-600 transition-colors font-medium text-sm min-h-[44px] inline-flex items-center"
    >
      + Create Role
    </Link>
  ) : null;

  if (!canViewRoles) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-sm text-gray-500">
                You don&apos;t have permission to view staff roles.
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
              <h1 className="text-3xl font-bold text-gray-900">Staff Roles</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage roles and their permissions for staff members
              </p>
            </div>
            {createButton}
          </div>

          <DataTable
            data={roles}
            columns={columns}
            getRowId={(r) => r.id}
            isLoading={isLoading}
            searchPlaceholder="Search roles…"
            exportFilename="staff-roles"
            selectable={canDeleteRoles}
            onDeleteSelected={canDeleteRoles ? handleDeleteSelected : undefined}
            onRowClick={(r) => router.push(`/admin/staff/roles/${r.id}`)}
            emptyTitle="No roles found"
            emptyDescription="Create a role to group staff permissions."
            emptyAction={createButton}
          />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
