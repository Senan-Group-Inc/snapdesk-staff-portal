'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffService from '@/services/staff.service';
import { StaffProfileList } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function StaffPage() {
  const router = useRouter();
  const { user } = useStaffAuth();
  const canViewStaff = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF);
  const canManageStaff = hasStaffPermission(user, STAFF_PERMISSIONS.MANAGE_STAFF);
  const [profiles, setProfiles] = useState<StaffProfileList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await staffService.listProfiles({ page: 1, count: 500 });
      setProfiles(response.data);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewStaff) fetchProfiles();
    else setIsLoading(false);
  }, [canViewStaff, fetchProfiles]);

  const columns = useMemo<DataTableColumn<StaffProfileList>[]>(
    () => [
      {
        id: 'name',
        header: 'Staff Member',
        accessor: (p) =>
          `${p.staff_user.full_name} ${p.staff_user.email || ''} ${p.staff_user.phone_number || ''}`.trim(),
        exportValue: (p) => p.staff_user.full_name,
        cell: (p) => (
          <div>
            <div className="font-medium text-gray-900">{p.staff_user.full_name}</div>
            <div className="text-gray-500">
              {p.staff_user.email || p.staff_user.phone_number}
            </div>
          </div>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        accessor: (p) => p.role_name || 'No role',
        filterable: true,
        cell: (p) =>
          p.role_name ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-admin/10 text-admin">
              {p.role_name}
            </span>
          ) : (
            <span className="text-gray-400">No role</span>
          ),
      },
      {
        id: 'glpi',
        header: 'GLPI',
        accessor: (p) => p.glpi_username || 'Not provisioned',
        cell: (p) =>
          p.glpi_username ? (
            <span className="font-mono text-gray-700">{p.glpi_username}</span>
          ) : (
            <span className="text-gray-400">Not provisioned</span>
          ),
      },
      {
        id: 'permissions',
        header: 'Permissions',
        accessor: (p) => String(p.permissions_count),
        cell: (p) => (
          <span className="text-gray-500">
            {p.permissions_count} permission{p.permissions_count !== 1 ? 's' : ''}
          </span>
        ),
      },
      {
        id: 'created',
        header: 'Created',
        accessor: (p) => new Date(p.created).toLocaleDateString(),
      },
    ],
    []
  );

  const handleDeleteSelected = async (rows: StaffProfileList[]) => {
    try {
      await Promise.all(rows.map((p) => staffService.deleteProfile(p.id)));
      toast.success(`Deleted ${rows.length} staff member${rows.length === 1 ? '' : 's'}.`);
      await fetchProfiles();
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      await fetchProfiles();
    }
  };

  const addButton = canManageStaff ? (
    <Link
      href="/admin/staff/new"
      className="px-4 py-2.5 bg-admin text-white rounded-lg hover:bg-admin-600 transition-colors font-medium text-sm min-h-[44px] inline-flex items-center"
    >
      + Add Staff Member
    </Link>
  ) : null;

  if (!canViewStaff) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-sm text-gray-500">
                You don&apos;t have permission to view staff members.
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
              <h1 className="text-3xl font-bold text-gray-900">Staff Members</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage Senan team accounts and GLPI engine logins
              </p>
            </div>
            {addButton}
          </div>

          <DataTable
            data={profiles}
            columns={columns}
            getRowId={(p) => p.id}
            isLoading={isLoading}
            searchPlaceholder="Search by name, email, phone, role, or GLPI…"
            exportFilename="staff-members"
            selectable={canManageStaff}
            onDeleteSelected={canManageStaff ? handleDeleteSelected : undefined}
            onRowClick={(p) => router.push(`/admin/staff/${p.id}`)}
            emptyTitle="No staff members"
            emptyDescription="Add a staff member to grant portal and GLPI access."
            emptyAction={addButton}
          />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
