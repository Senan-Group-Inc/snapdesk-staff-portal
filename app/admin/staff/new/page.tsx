'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffService from '@/services/staff.service';
import { StaffRoleList } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import { glpiLoginUrl } from '@/utils/glpi-url';
import { ModalSelect } from '@/components/ui';

export default function NewStaffPage() {
  const router = useRouter();
  const { user } = useStaffAuth();
  const canCreate = hasStaffPermission(user, STAFF_PERMISSIONS.CREATE_STAFF)
    || hasStaffPermission(user, STAFF_PERMISSIONS.MANAGE_STAFF);

  const [roles, setRoles] = useState<StaffRoleList[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    snapdeskPassword?: string | null;
    glpiUsername?: string | null;
    glpiPassword?: string | null;
    glpiLoginUrl?: string | null;
  } | null>(null);

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role_id: '' as number | '',
    password: '',
    provision_glpi: true,
  });

  useEffect(() => {
    if (!canCreate) return;
    staffService
      .listRoles({ page: 1 })
      .then((res) => setRoles(res.data))
      .catch((err) => toast.error(handleApiError(err)));
  }, [canCreate]);

  const selectedRole = roles.find((r) => r.id === form.role_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!form.role_id) {
      toast.error('Select a staff role');
      return;
    }

    setIsSaving(true);
    try {
      const result = await staffService.createStaffWithGlpi({
        email: form.email.trim(),
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        phone_number: form.phone_number.trim() || undefined,
        role_id: Number(form.role_id),
        password: form.password.trim() || undefined,
        provision_glpi: form.provision_glpi,
      });

      setCredentials({
        email: result.email,
        snapdeskPassword: result.snapdesk_password || form.password || null,
        glpiUsername: result.glpi?.glpi_username || null,
        glpiPassword: result.glpi?.password || form.password || null,
        glpiLoginUrl: result.glpi?.glpi_login_url || glpiLoginUrl(),
      });

      if (result.glpi?.created) {
        toast.success('Staff created and provisioned in GLPI');
      } else if (form.provision_glpi && !result.glpi) {
        toast.success('Staff created (GLPI skipped — role has no GLPI profile)');
      } else {
        toast.success('Staff created');
      }
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="w-full bg-white rounded-xl border border-gray-100 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-sm text-gray-500">You do not have permission to create staff.</p>
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
            <Link href="/admin/staff" className="text-sm text-admin hover:text-admin-600">
              ← Back to staff
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">Add Staff Member</h1>
            <p className="mt-2 text-sm text-gray-600">
              Creates a SnapDesk staff account and optionally a matching GLPI login
              so tech can sign into the engine UI.
            </p>
          </div>

          {credentials ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Account ready</h2>
              <p className="text-sm text-gray-600">
                Copy these credentials now — generated passwords are only shown once.
              </p>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">SnapDesk email</dt>
                  <dd className="font-mono text-gray-900">{credentials.email}</dd>
                </div>
                {credentials.snapdeskPassword && (
                  <div>
                    <dt className="text-gray-500">SnapDesk password</dt>
                    <dd className="font-mono text-gray-900">{credentials.snapdeskPassword}</dd>
                  </div>
                )}
                {credentials.glpiUsername && (
                  <div>
                    <dt className="text-gray-500">GLPI username</dt>
                    <dd className="font-mono text-gray-900">{credentials.glpiUsername}</dd>
                  </div>
                )}
                {credentials.glpiPassword && (
                  <div>
                    <dt className="text-gray-500">GLPI password</dt>
                    <dd className="font-mono text-gray-900">{credentials.glpiPassword}</dd>
                  </div>
                )}
                {credentials.glpiLoginUrl && (
                  <div>
                    <dt className="text-gray-500">GLPI login</dt>
                    <dd>
                      <a
                        href={credentials.glpiLoginUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-admin hover:underline"
                      >
                        {credentials.glpiLoginUrl}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              <button
                type="button"
                onClick={() => router.push('/admin/staff')}
                className="mt-4 px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-600"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-admin focus:border-admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-admin focus:border-admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-admin focus:border-admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-admin focus:border-admin"
                />
              </div>

              <div>
                <ModalSelect
                  label="Staff role"
                  labelVisible
                  required
                  value={form.role_id === '' ? '' : String(form.role_id)}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      role_id: v ? Number(v) : '',
                    })
                  }
                  placeholder="Select a role…"
                  options={[
                    { value: '', label: 'Select a role…' },
                    ...roles.map((role) => ({
                      value: String(role.id),
                      label: role.glpi_profile_name
                        ? `${role.name} › GLPI ${role.glpi_profile_name}`
                        : role.name,
                    })),
                  ]}
                />
                {selectedRole?.glpi_profile_name && (
                  <p className="mt-1 text-xs text-gray-500">
                    Will map to GLPI profile “{selectedRole.glpi_profile_name}”.
                  </p>
                )}
                {selectedRole && !selectedRole.glpi_profile_name && form.provision_glpi && (
                  <p className="mt-1 text-xs text-amber-600">
                    This role has no GLPI profile mapping — GLPI login will be skipped.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password (optional)
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to auto-generate"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-admin focus:border-admin font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Same password is used for SnapDesk and GLPI when provisioning.
                </p>
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.provision_glpi}
                  onChange={(e) => setForm({ ...form, provision_glpi: e.target.checked })}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  Also create a GLPI account so they can log into the service desk engine.
                  {form.provision_glpi && form.email.trim() ? (
                    <>
                      {' '}
                      Their GLPI login will be their email:{' '}
                      <span className="font-mono text-gray-900">
                        {form.email.trim().toLowerCase()}
                      </span>
                      .
                    </>
                  ) : form.provision_glpi ? (
                    <> Their GLPI login will be the email you enter above.</>
                  ) : null}
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Link
                  href="/admin/staff"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-600 disabled:opacity-50"
                >
                  {isSaving ? 'Creating…' : 'Create staff'}
                </button>
              </div>
            </form>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
