'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import { StaffOrganisation, StaffOrganisationMember } from '@/types';
import { handleApiError } from '@/utils/error-handler';

export default function OrganisationMembersPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useStaffAuth();
  const organisationId = parseInt(params.id as string, 10);
  const canUpdate = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_ORGANISATIONS);

  const [organisation, setOrganisation] = useState<StaffOrganisation | null>(null);
  const [members, setMembers] = useState<StaffOrganisationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [org, memberList] = await Promise.all([
        organisationService.getOrganisation(organisationId),
        organisationService.listMembers(organisationId),
      ]);
      setOrganisation(org);
      setMembers(memberList);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      router.push('/admin/organisations');
    } finally {
      setIsLoading(false);
    }
  }, [organisationId, router]);

  useEffect(() => {
    if (organisationId) load();
  }, [organisationId, load]);

  const columns = useMemo<DataTableColumn<StaffOrganisationMember>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessor: (m) => m.account_name,
        className: 'px-6 py-4 text-gray-900',
      },
      {
        id: 'email',
        header: 'Email',
        accessor: (m) => m.account_email || '',
      },
      {
        id: 'role',
        header: 'Role',
        accessor: (m) => m.role_name || '',
        filterable: true,
      },
      {
        id: 'position',
        header: 'Position',
        accessor: (m) => m.position || '',
        filterable: true,
      },
    ],
    []
  );

  const handleDeleteSelected = async (rows: StaffOrganisationMember[]) => {
    try {
      const result = await organisationService.deleteMembers(
        organisationId,
        rows.map((r) => r.id)
      );
      if (result.skipped_owner) {
        toast.error(
          `Deleted ${result.deleted}. Skipped ${result.skipped_owner} owner account(s).`
        );
      } else {
        toast.success(`Deleted ${result.deleted} member${result.deleted === 1 ? '' : 's'}.`);
      }
      await load();
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    }
  };

  const addButton = canUpdate ? (
    <Link
      href={`/admin/organisations/${organisationId}/members/new`}
      className="px-4 py-2.5 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 min-h-[44px] inline-flex items-center"
    >
      + Add member
    </Link>
  ) : null;

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/organisations/${organisationId}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Client portal users</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {organisation?.name || 'Organization'} · tenant employees for the client portal
                </p>
              </div>
            </div>
            {addButton}
          </div>

          <DataTable
            data={members}
            columns={columns}
            getRowId={(m) => m.id}
            isLoading={isLoading}
            searchPlaceholder="Search by name, email, role, or position"
            exportFilename={`${organisation?.subdomain || 'org'}-portal-users`}
            selectable={canUpdate}
            onDeleteSelected={canUpdate ? handleDeleteSelected : undefined}
            getDeleteConfirmMessage={(rows) =>
              `Delete ${rows.length} client portal user${rows.length === 1 ? '' : 's'}? The org owner cannot be deleted.`
            }
            onRowClick={(m) =>
              router.push(`/admin/organisations/${organisationId}/members/${m.id}`)
            }
            emptyTitle="No client portal users yet"
            emptyDescription="Add a member to seed someone who can sign in to this org's client portal."
            emptyAction={addButton}
          />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
