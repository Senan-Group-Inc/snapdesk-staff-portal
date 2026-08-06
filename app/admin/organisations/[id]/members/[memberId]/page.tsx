'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { Modal, ModalSelect } from '@/components/ui';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import {
  StaffOrganisation,
  StaffOrganisationMember,
  StaffOrganisationRole,
} from '@/types';
import { handleApiError } from '@/utils/error-handler';

type MemberHub = 'profile' | 'role' | null;

function HubChevron() {
  return (
    <svg
      className="w-5 h-5 text-gray-400 group-hover:text-admin shrink-0 mt-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function OrganisationMemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useStaffAuth();
  const organisationId = parseInt(params.id as string, 10);
  const memberId = parseInt(params.memberId as string, 10);
  const canUpdate = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_ORGANISATIONS);

  const [organisation, setOrganisation] = useState<StaffOrganisation | null>(null);
  const [member, setMember] = useState<StaffOrganisationMember | null>(null);
  const [roles, setRoles] = useState<StaffOrganisationRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hub, setHub] = useState<MemberHub>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });
  const [roleForm, setRoleForm] = useState({
    role_id: '',
    position: '',
    department: '',
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [org, m] = await Promise.all([
        organisationService.getOrganisation(organisationId),
        organisationService.getMember(organisationId, memberId),
      ]);
      setOrganisation(org);
      setMember(m);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      router.push(`/admin/organisations/${organisationId}/members`);
    } finally {
      setIsLoading(false);
    }
  }, [organisationId, memberId, router]);

  useEffect(() => {
    if (organisationId && memberId) load();
  }, [organisationId, memberId, load]);

  useEffect(() => {
    if (!organisationId || !canUpdate) return;
    organisationService
      .listRoles(organisationId)
      .then(setRoles)
      .catch(() => setRoles([]));
  }, [organisationId, canUpdate]);

  const openProfile = () => {
    if (!member) return;
    setProfileForm({
      first_name: member.account_first_name || '',
      last_name: member.account_last_name || '',
      email: member.account_email || '',
      phone_number: member.account_phone || '',
    });
    setHub('profile');
  };

  const openRole = () => {
    if (!member) return;
    setRoleForm({
      role_id: member.role_id ? String(member.role_id) : '',
      position: member.position || '',
      department: member.department || '',
    });
    setHub('role');
  };

  const closeHub = () => {
    if (!isSaving) setHub(null);
  };

  const saveProfile = async () => {
    if (!profileForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await organisationService.updateMember(organisationId, memberId, {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        email: profileForm.email.trim(),
        phone_number: profileForm.phone_number.trim() || null,
      });
      setMember(updated);
      setHub(null);
      toast.success('Profile updated');
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const saveRole = async () => {
    setIsSaving(true);
    try {
      const updated = await organisationService.updateMember(organisationId, memberId, {
        role_id: roleForm.role_id ? Number(roleForm.role_id) : null,
        position: roleForm.position.trim(),
        department: roleForm.department.trim() || null,
      });
      setMember(updated);
      setHub(null);
      toast.success('Role and job updated');
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const profileSummary = member
    ? [member.account_email, member.account_phone].filter(Boolean).join(' · ') || 'No contact details'
    : '';
  const roleSummary = member
    ? [member.role_name || 'No role', member.position, member.department]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/organisations/${organisationId}/members`}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {member?.account_name || 'Client portal user'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {organisation?.name || 'Organization'} · client portal user
              </p>
            </div>
          </div>

          {isLoading || !member ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin" />
              <p className="mt-4 text-gray-600">Loading…</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={!canUpdate}
                  onClick={openProfile}
                  className="group text-left bg-white rounded-lg border border-gray-200 p-5 hover:border-admin/40 hover:bg-gray-50/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-admin">
                        Profile
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">Name, email, and phone</p>
                    </div>
                    {canUpdate && <HubChevron />}
                  </div>
                  <p className="mt-4 text-sm text-gray-800 line-clamp-2">{profileSummary}</p>
                </button>

                <button
                  type="button"
                  disabled={!canUpdate}
                  onClick={openRole}
                  className="group text-left bg-white rounded-lg border border-gray-200 p-5 hover:border-admin/40 hover:bg-gray-50/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-admin">
                        Role &amp; job
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Organisation role, position, department
                      </p>
                    </div>
                    {canUpdate && <HubChevron />}
                  </div>
                  <p className="mt-4 text-sm text-gray-800 line-clamp-2">{roleSummary}</p>
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Account ID</dt>
                    <dd className="mt-1 text-gray-900 font-mono">{member.account_id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Member ID</dt>
                    <dd className="mt-1 text-gray-900 font-mono">{member.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-gray-900">
                      {new Date(member.created).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>

        <Modal
          open={hub === 'profile'}
          onClose={closeHub}
          title="Edit profile"
          description="Update this person’s contact details for the client portal."
          footer={
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={closeHub}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={saveProfile}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save profile'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-admin focus:border-admin min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-admin focus:border-admin min-h-[44px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-admin focus:border-admin min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={profileForm.phone_number}
                onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-admin focus:border-admin min-h-[44px]"
              />
            </div>
          </div>
        </Modal>

        <Modal
          open={hub === 'role'}
          onClose={closeHub}
          title="Edit role & job"
          description="Organisation role and job details for this tenant member."
          footer={
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={closeHub}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={saveRole}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <ModalSelect
              label="Organisation role"
              labelVisible
              value={roleForm.role_id}
              onChange={(v) => setRoleForm({ ...roleForm, role_id: v })}
              placeholder="No role"
              options={[
                { value: '', label: 'No role' },
                ...roles.map((r) => ({ value: String(r.id), label: r.name })),
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                value={roleForm.position}
                onChange={(e) => setRoleForm({ ...roleForm, position: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-admin focus:border-admin min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                value={roleForm.department}
                onChange={(e) => setRoleForm({ ...roleForm, department: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-admin focus:border-admin min-h-[44px]"
              />
            </div>
          </div>
        </Modal>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
