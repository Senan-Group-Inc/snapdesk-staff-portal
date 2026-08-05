'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import { StaffOrganisation } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';

const getPlanBadgeColor = (plan: string) => {
  switch (plan) {
    case 'enterprise':
      return 'bg-purple-100 text-purple-800';
    case 'pro':
      return 'bg-blue-100 text-blue-800';
    case 'free':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function OrganisationsPage() {
  const router = useRouter();
  const { user } = useStaffAuth();
  const canCreateOrganisations = hasStaffPermission(user, STAFF_PERMISSIONS.CREATE_ORGANISATIONS);
  const canManageOrganisations = hasStaffPermission(user, STAFF_PERMISSIONS.MANAGE_ORGANISATIONS);
  const [organisations, setOrganisations] = useState<StaffOrganisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganisations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await organisationService.listOrganisations({ page: 1, count: 500 });
      setOrganisations(response.data);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganisations();
  }, [fetchOrganisations]);

  const columns = useMemo<DataTableColumn<StaffOrganisation>[]>(
    () => [
      {
        id: 'name',
        header: 'Organization',
        accessor: (org) => org.name,
        cell: (org) => <span className="font-medium text-gray-900">{org.name}</span>,
      },
      {
        id: 'subdomain',
        header: 'Subdomain',
        accessor: (org) => org.subdomain,
      },
      {
        id: 'portal',
        header: 'Portal',
        accessor: (org) => (org.portal_ready ? 'Ready' : 'Not ready'),
        filterable: true,
        cell: (org) =>
          org.portal_ready ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Ready
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
              Not ready
            </span>
          ),
      },
      {
        id: 'plan',
        header: 'Plan',
        accessor: (org) => org.plan,
        filterable: true,
        cell: (org) => (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeColor(org.plan)}`}>
            {org.plan}
          </span>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        accessor: (org) => org.email || '',
      },
      {
        id: 'created',
        header: 'Created',
        accessor: (org) => new Date(org.created).toLocaleDateString(),
      },
    ],
    []
  );

  const handleDeleteSelected = async (rows: StaffOrganisation[]) => {
    try {
      await Promise.all(rows.map((org) => organisationService.deleteOrganisation(org.id)));
      toast.success(`Deleted ${rows.length} organization${rows.length === 1 ? '' : 's'}.`);
      await fetchOrganisations();
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      await fetchOrganisations();
    }
  };

  const createButton = canCreateOrganisations ? (
    <Link
      href="/admin/organisations/new"
            className="px-4 py-2.5 bg-admin text-white rounded-lg hover:bg-admin-600 transition-colors font-medium text-sm min-h-[44px] inline-flex items-center shrink-0"
    >
      + Create Organization
    </Link>
  ) : null;

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage tenant organizations. Mark a portal ready when DNS/hosting is live, then emails go out.
              </p>
            </div>
            {createButton}
          </div>

          <DataTable
            data={organisations}
            columns={columns}
            getRowId={(org) => org.id}
            isLoading={isLoading}
            searchPlaceholder="Search by name, subdomain, email, plan…"
            exportFilename="organisations"
            selectable={canManageOrganisations}
            onDeleteSelected={canManageOrganisations ? handleDeleteSelected : undefined}
            getDeleteConfirmMessage={(rows) =>
              `Delete ${rows.length} organization${rows.length === 1 ? '' : 's'}? This cannot be undone.`
            }
            onRowClick={(org) => router.push(`/admin/organisations/${org.id}`)}
            emptyTitle="No organizations found"
            emptyDescription="Create an organization to start onboarding a tenant portal."
            emptyAction={createButton}
          />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
