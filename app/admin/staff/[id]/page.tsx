'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffService from '@/services/staff.service';
import { StaffProfileDetail, StaffRoleList } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import { glpiLoginUrl } from '@/utils/glpi-url';

export default function StaffDetailPage() {
  const params = useParams();
  const profileId = Number(params.id);
  const { user } = useStaffAuth();
  const canView = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF);
  const canManage = hasStaffPermission(user, STAFF_PERMISSIONS.MANAGE_STAFF)
    || hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_STAFF);

  const [profile, setProfile] = useState<StaffProfileDetail | null>(null);
  const [roles, setRoles] = useState<StaffRoleList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionPassword, setProvisionPassword] = useState('');
  const [shownGlpiPassword, setShownGlpiPassword] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [p, r] = await Promise.all([
        staffService.getProfile(profileId),
        staffService.listRoles({ page: 1 }),
      ]);
      setProfile(p);
      setRoles(r.data);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canView && profileId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, profileId]);

  const handleAssignRole = async (roleId: number) => {
    try {
      const updated = await staffService.assignRoleToProfile(profileId, { role_id: roleId });
      setProfile(updated);
      toast.success('Role updated');
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    }
  };

  const handleProvision = async () => {
    setIsProvisioning(true);
    setShownGlpiPassword(null);
    try {
      const result = await staffService.provisionGlpi(profileId, {
        password: provisionPassword.trim() || undefined,
      });
      setProfile(result.profile);
      if (result.password) setShownGlpiPassword(result.password);
      toast.success(
        result.created
          ? `GLPI user ${result.glpi_username} created`
          : `Linked existing GLPI user ${result.glpi_username}`
      );
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsProvisioning(false);
    }
  };

  if (!canView) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-100 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          <Link href="/admin/staff" className="text-sm text-admin hover:text-admin-600">
            ← Back to staff
          </Link>

          {isLoading || !profile ? (
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin" />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.staff_user.full_name}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {profile.staff_user.email || profile.staff_user.phone_number}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.role ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-admin/10 text-admin">
                      {profile.role.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No role</span>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Role</h2>
                  <select
                    value={profile.role?.id || ''}
                    onChange={(e) => {
                      if (e.target.value) handleAssignRole(Number(e.target.value));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-admin focus:border-admin"
                  >
                    <option value="">Select role…</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                        {role.glpi_profile_name ? ` → ${role.glpi_profile_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">GLPI access</h2>
                {profile.glpi_user_id ? (
                  <dl className="text-sm space-y-2">
                    <div>
                      <dt className="text-gray-500">Username</dt>
                      <dd className="font-mono text-gray-900">{profile.glpi_username}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">User id</dt>
                      <dd className="font-mono text-gray-900">{profile.glpi_user_id}</dd>
                    </div>
                    {profile.glpi_provisioned_at && (
                      <div>
                        <dt className="text-gray-500">Provisioned</dt>
                        <dd className="text-gray-900">
                          {new Date(profile.glpi_provisioned_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Login</dt>
                      <dd>
                        <a
                          href={glpiLoginUrl()}
                          target="_blank"
                          rel="noreferrer"
                          className="text-admin hover:underline"
                        >
                          {glpiLoginUrl()}
                        </a>
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-gray-600">
                    Not linked to GLPI yet. Provision a login so this person can open the
                    engine UI.
                  </p>
                )}

                {shownGlpiPassword && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
                    <p className="font-medium text-amber-900">Generated GLPI password (once):</p>
                    <p className="font-mono text-amber-950 mt-1">{shownGlpiPassword}</p>
                  </div>
                )}

                {canManage && (
                  <div className="pt-2 space-y-3 border-t border-gray-100">
                    <input
                      type="text"
                      value={provisionPassword}
                      onChange={(e) => setProvisionPassword(e.target.value)}
                      placeholder="Optional GLPI password (auto-generate if blank)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-admin focus:border-admin"
                    />
                    <button
                      type="button"
                      disabled={isProvisioning}
                      onClick={handleProvision}
                      className="px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-600 disabled:opacity-50"
                    >
                      {isProvisioning
                        ? 'Provisioning…'
                        : profile.glpi_user_id
                          ? 'Re-sync GLPI profile'
                          : 'Provision GLPI account'}
                    </button>
                    {!profile.role?.glpi_profile_name && (
                      <p className="text-xs text-amber-600">
                        Role has no glpi_profile_name — set one on the role (e.g. Technician)
                        before provisioning, or it will fail.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
