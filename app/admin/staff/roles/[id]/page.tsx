'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffService from '@/services/staff.service';
import { StaffPermissionList, StaffRoleDetail } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import { Checkbox, ModalSelect } from '@/components/ui';

const GLPI_PROFILES = [
  'Super-Admin',
  'Admin',
  'Technician',
  'Supervisor',
  'Hotliner',
  'Observer',
  'Self-Service',
  'Read-Only',
];

export default function EditStaffRolePage() {
  const params = useParams();
  const roleId = Number(params.id);
  const router = useRouter();
  const { user } = useStaffAuth();
  const canView = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF_ROLES);
  const canUpdate = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_STAFF_ROLES)
    || hasStaffPermission(user, STAFF_PERMISSIONS.MANAGE_STAFF_ROLES);

  const [role, setRole] = useState<StaffRoleDetail | null>(null);
  const [permissions, setPermissions] = useState<StaffPermissionList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    glpi_profile_name: '',
    permission_ids: [] as number[],
  });

  useEffect(() => {
    if (!canView || !roleId) return;
    (async () => {
      setIsLoading(true);
      try {
        const [r, p] = await Promise.all([
          staffService.getRole(roleId),
          staffService.listPermissions({ page: 1 }),
        ]);
        setRole(r);
        setPermissions(p.data);
        setForm({
          name: r.name,
          description: r.description || '',
          glpi_profile_name: r.glpi_profile_name || '',
          permission_ids: (r.permissions || []).map((x) => x.id),
        });
      } catch (error: unknown) {
        toast.error(handleApiError(error));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [canView, roleId]);

  const togglePermission = (id: number) => {
    setForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((x) => x !== id)
        : [...prev.permission_ids, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;
    setIsSaving(true);
    try {
      await staffService.updateRole(roleId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        glpi_profile_name: form.glpi_profile_name || null,
        permission_ids: form.permission_ids,
      });
      toast.success('Role updated');
      router.push('/admin/staff/roles');
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (!canView) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="w-full bg-white rounded-xl border border-gray-100 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full">
          <Link href="/admin/staff/roles" className="text-sm text-admin hover:text-admin-600">
            ← Back to roles
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            {role ? `Edit: ${role.name}` : 'Edit Role'}
          </h1>

          {isLoading ? (
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin" />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 bg-white rounded-lg border border-gray-200 p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  disabled={!canUpdate}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-admin focus:border-admin disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  disabled={!canUpdate}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-admin focus:border-admin disabled:bg-gray-50"
                />
              </div>

              <div>
                <ModalSelect
                  label="GLPI profile"
                  labelVisible
                  disabled={!canUpdate}
                  value={form.glpi_profile_name}
                  onChange={(v) => setForm({ ...form, glpi_profile_name: v })}
                  placeholder="None (skip GLPI provisioning)"
                  options={[
                    { value: '', label: 'None (skip GLPI provisioning)' },
                    ...GLPI_PROFILES.map((name) => ({
                      value: name,
                      label: name,
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className={`flex items-start gap-3 px-3 py-2 ${canUpdate ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                    >
                      <Checkbox
                        checked={form.permission_ids.includes(perm.id)}
                        disabled={!canUpdate}
                        onChange={() => togglePermission(perm.id)}
                        size="sm"
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{perm.name}</span>
                        {perm.description && (
                          <span className="block text-xs text-gray-500">{perm.description}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {canUpdate && (
                <div className="flex justify-end gap-3 pt-2">
                  <Link
                    href="/admin/staff/roles"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-600 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
