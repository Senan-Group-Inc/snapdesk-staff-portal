'use client';

import { useState, useEffect } from 'react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffService from '@/services/staff.service';
import { StaffPermissionList, PaginatedStaffPermissionsResponse } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function StaffPermissionsPage() {
  const { user } = useStaffAuth();
  const canViewPermissions = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF_PERMISSIONS);
  const canManagePermissions = hasStaffPermission(user, STAFF_PERMISSIONS.MANAGE_STAFF_PERMISSIONS);
  const canCreatePermissions = hasStaffPermission(user, STAFF_PERMISSIONS.CREATE_STAFF_PERMISSIONS);
  const canUpdatePermissions = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_STAFF_PERMISSIONS);
  const canDeletePermissions = hasStaffPermission(user, STAFF_PERMISSIONS.DELETE_STAFF_PERMISSIONS);
  const [permissions, setPermissions] = useState<StaffPermissionList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
    current_page: 1,
  });

  useEffect(() => {
    if (canViewPermissions) {
      fetchPermissions();
    }
  }, [pagination.current_page, canViewPermissions]);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await staffService.listPermissions({
        page: pagination.current_page,
      });
      setPermissions(response.data);
      setPagination({
        count: response.count,
        total_pages: response.total_pages,
        current_page: pagination.current_page,
      });
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the permission "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await staffService.deletePermission(id);
      toast.success('Permission deleted successfully');
      fetchPermissions();
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  if (!canViewPermissions) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-sm text-gray-500">
                You don't have permission to view staff permissions.
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Staff Permissions</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage permissions that can be assigned to staff roles
                </p>
              </div>
              {canCreatePermissions && (
                <Link
                  href="/admin/staff/permissions/new"
                  className="px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-600 transition-colors font-medium"
                >
                  + Create Permission
                </Link>
              )}
            </div>
          </div>

          {/* Permissions List */}
          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin"></div>
              <p className="mt-4 text-sm text-gray-500">Loading permissions...</p>
            </div>
          ) : permissions.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Permissions Found</h3>
              <p className="text-sm text-gray-500">
                No permissions have been created yet.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permission Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {permissions.map((permission) => (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {permission.description || <span className="text-gray-400">No description</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(permission.created).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-3">
                            {canUpdatePermissions && (
                              <Link
                                href={`/admin/staff/permissions/${permission.id}/edit`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </Link>
                            )}
                            {canDeletePermissions && (
                              <button
                                onClick={() => handleDelete(permission.id, permission.name)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {permissions.length} of {pagination.count} permissions
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                      disabled={pagination.current_page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {pagination.current_page} of {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                      disabled={pagination.current_page === pagination.total_pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}

