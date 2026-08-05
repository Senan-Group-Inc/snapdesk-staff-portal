'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import organisationService from '@/services/organisation.service';
import { StaffOrganisation, StaffOrganisationMember } from '@/types';
import { handleApiError } from '@/utils/error-handler';

export default function OrganisationMemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const organisationId = parseInt(params.id as string, 10);
  const memberId = parseInt(params.memberId as string, 10);

  const [organisation, setOrganisation] = useState<StaffOrganisation | null>(null);
  const [member, setMember] = useState<StaffOrganisationMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organisationId || !memberId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [org, members] = await Promise.all([
          organisationService.getOrganisation(organisationId),
          organisationService.listMembers(organisationId),
        ]);
        if (cancelled) return;
        setOrganisation(org);
        const found = members.find((m) => m.id === memberId) || null;
        if (!found) {
          toast.error('Member not found');
          router.push(`/admin/organisations/${organisationId}/members`);
          return;
        }
        setMember(found);
      } catch (error: unknown) {
        toast.error(handleApiError(error));
        router.push(`/admin/organisations/${organisationId}/members`);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organisationId, memberId, router]);

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href={`/admin/organisations/${organisationId}/members`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {member?.account_name || 'Client portal user'}
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  {organisation?.name || 'Organization'} · client portal user
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin" />
              <p className="mt-4 text-gray-600">Loading…</p>
            </div>
          ) : member ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.account_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.account_email || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.account_phone || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.role_name || 'No role'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Position</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.position || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.department || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{member.account_id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(member.created).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
