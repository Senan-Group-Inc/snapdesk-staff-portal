'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import { StaffOrganisation, StaffOrganisationRole } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import { ModalSelect } from '@/components/ui';

export default function NewOrganisationMemberPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useStaffAuth();
  const organisationId = parseInt(params.id as string, 10);
  const canUpdate = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_ORGANISATIONS);

  const [organisation, setOrganisation] = useState<StaffOrganisation | null>(null);
  const [roles, setRoles] = useState<StaffOrganisationRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    email: '',
    phone_number: '',
    first_name: '',
    last_name: '',
    role_id: '',
    position: '',
  });

  useEffect(() => {
    if (!organisationId || !canUpdate) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [org, roleList] = await Promise.all([
          organisationService.getOrganisation(organisationId),
          organisationService.listRoles(organisationId),
        ]);
        if (cancelled) return;
        setOrganisation(org);
        setRoles(roleList);
      } catch (error: unknown) {
        toast.error(handleApiError(error));
        router.push('/admin/organisations');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organisationId, canUpdate, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    setIsSaving(true);
    try {
      const created = await organisationService.createMember(organisationId, {
        email: form.email.trim(),
        phone_number: form.phone_number.trim() || undefined,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        role_id: form.role_id ? parseInt(form.role_id, 10) : null,
        position: form.position.trim() || undefined,
      });
      if (created.portal_email_sent) {
        toast.success('Member created and portal email sent.');
      } else if (organisation?.portal_ready && created.portal_email_error) {
        toast.error(`Member created, but email failed: ${created.portal_email_error}`);
      } else if (!organisation?.portal_ready) {
        toast.success('Member created. They will be emailed when the portal is marked ready.');
      } else {
        toast.success('Member created.');
      }
      router.push(`/admin/organisations/${organisationId}/members/${created.id}`);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (!canUpdate) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="w-full">
            <p className="text-sm text-gray-600">You do not have permission to add members.</p>
            <Link href={`/admin/organisations/${organisationId}/members`} className="text-admin text-sm mt-2 inline-block">
              Back to members
            </Link>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Add client portal user</h1>
                <p className="mt-2 text-sm text-gray-600">
                  {organisation?.name || 'Organization'} · seeds a tenant login for the client portal
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin" />
              <p className="mt-4 text-gray-600">Loading…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    placeholder="+233..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                  />
                </div>
                <div className="sm:col-span-2">
                  <ModalSelect
                    label="Role"
                    labelVisible
                    value={form.role_id}
                    onChange={(v) => setForm({ ...form, role_id: v })}
                    placeholder="No role"
                    options={[
                      { value: '', label: 'No role' },
                      ...roles.map((r) => ({ value: String(r.id), label: r.name })),
                    ]}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500">
                {organisation?.portal_ready
                  ? 'Portal is ready: this person will get a welcome email with the portal URL.'
                  : 'Portal is not ready yet: no email until you mark the portal ready.'}
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Link
                  href={`/admin/organisations/${organisationId}/members`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50"
                >
                  {isSaving ? 'Creating…' : 'Create member'}
                </button>
              </div>
            </form>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
