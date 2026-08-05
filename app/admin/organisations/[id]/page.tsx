'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, hasAnyStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import productModuleService from '@/services/product-module.service';
import {
  StaffOrganisation,
  UpdateStaffOrganisationRequest,
  ProductModule,
  StaffOrganisationMember,
  StaffOrganisationRole,
} from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';
import OrganisationEnabledModulesFields, {
  ORGANISATION_CORE_MODULE_KEY,
} from '@/components/OrganisationEnabledModulesFields';

export default function OrganisationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useStaffAuth();
  const canUpdateOrganisations = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_ORGANISATIONS);
  const canLoadModuleCatalog = hasAnyStaffPermission(user, [
    STAFF_PERMISSIONS.VIEW_PRODUCT_MODULES,
    STAFF_PERMISSIONS.MANAGE_ORGANISATIONS,
  ]);
  const organisationId = parseInt(params.id as string);

  const [organisation, setOrganisation] = useState<StaffOrganisation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [formData, setFormData] = useState<UpdateStaffOrganisationRequest>({
    name: '',
    email: '',
    plan: 'free',
    settings: {},
    email_domain: null,
    auth_method: 'local',
  });
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [moduleCatalog, setModuleCatalog] = useState<ProductModule[]>([]);
  const [modulesMode, setModulesMode] = useState<'all' | 'custom'>('all');
  const [enabledModuleKeys, setEnabledModuleKeys] = useState<string[]>([
    ORGANISATION_CORE_MODULE_KEY,
  ]);

  const [members, setMembers] = useState<StaffOrganisationMember[]>([]);
  const [roles, setRoles] = useState<StaffOrganisationRole[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberBusy, setMemberBusy] = useState(false);
  const [memberForm, setMemberForm] = useState({
    email: '',
    phone_number: '',
    first_name: '',
    last_name: '',
    role_id: '' as string,
    position: '',
  });

  const applyModuleStateFromOrganisation = useCallback((data: StaffOrganisation) => {
    if (data.enabled_modules == null) {
      setModulesMode('all');
      setEnabledModuleKeys([ORGANISATION_CORE_MODULE_KEY]);
    } else {
      setModulesMode('custom');
      setEnabledModuleKeys(
        Array.from(new Set([...data.enabled_modules, ORGANISATION_CORE_MODULE_KEY]))
      );
    }
  }, []);

  const loadModuleCatalog = useCallback(async () => {
    if (!canLoadModuleCatalog) return;
    try {
      const res = await productModuleService.listProductModules();
      const sorted = [...res.data].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.key.localeCompare(b.key);
      });
      setModuleCatalog(sorted);
    } catch {
      setModuleCatalog([]);
    }
  }, [canLoadModuleCatalog]);

  const fetchMembersAndRoles = useCallback(async () => {
    if (!organisationId) return;
    setMembersLoading(true);
    try {
      const [memberList, roleList] = await Promise.all([
        organisationService.listMembers(organisationId),
        organisationService.listRoles(organisationId),
      ]);
      setMembers(memberList);
      setRoles(roleList);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setMembersLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    if (organisationId) {
      fetchOrganisation();
    }
  }, [organisationId]);

  useEffect(() => {
    if (organisationId && user) {
      loadModuleCatalog();
      fetchMembersAndRoles();
    }
  }, [organisationId, user, loadModuleCatalog, fetchMembersAndRoles]);

  const fetchOrganisation = async () => {
    setIsLoading(true);
    try {
      const data = await organisationService.getOrganisation(organisationId);
      setOrganisation(data);
      setFormData({
        name: data.name,
        email: data.email,
        plan: data.plan,
        settings: data.settings || {},
        email_domain: data.email_domain || null,
        auth_method: data.auth_method || 'local',
      });
      setNewOwnerId(data.owner?.toString() || '');
      applyModuleStateFromOrganisation(data);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      router.push('/admin/organisations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: UpdateStaffOrganisationRequest = {
        ...formData,
      };

      const newOwnerIdNum = newOwnerId ? parseInt(newOwnerId) : null;
      if (newOwnerIdNum !== organisation?.owner) {
        if (newOwnerIdNum) {
          updateData.owner = newOwnerIdNum;
        }
      }

      if (modulesMode === 'all') {
        updateData.enabled_modules = null;
      } else {
        updateData.enabled_modules = [...enabledModuleKeys].sort();
      }

      const updated = await organisationService.updateOrganisation(organisationId, updateData);
      setOrganisation(updated);
      setNewOwnerId(updated.owner?.toString() || '');
      applyModuleStateFromOrganisation(updated);
      setIsEditing(false);
      toast.success('Organization updated successfully!');
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const copyPortalUrl = async () => {
    const url = organisation?.portal_url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Portal URL copied');
    } catch {
      toast.error('Could not copy URL');
    }
  };

  const handleMarkReady = async () => {
    if (!organisation) return;
    const n = organisation.portal_email_recipient_count ?? 0;
    const ok = window.confirm(
      `Mark portal ready and email ${n || 'owner/members'} with the portal URL and sign-in instructions?`
    );
    if (!ok) return;
    setPortalBusy(true);
    try {
      const result = await organisationService.markPortalReady(organisationId);
      setOrganisation(result);
      const er = result.email_result;
      if (er) {
        if (er.failed?.length) {
          toast.error(
            `Portal marked ready. Sent ${er.sent}/${er.total}; ${er.failed.length} failed.`
          );
        } else {
          toast.success(`Portal marked ready. Emailed ${er.sent} recipient(s).`);
        }
      } else {
        toast.success('Portal marked ready.');
      }
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setPortalBusy(false);
    }
  };

  const handleUnmarkReady = async () => {
    if (!window.confirm('Mark this portal as not ready? This does not revoke access.')) return;
    setPortalBusy(true);
    try {
      const updated = await organisationService.unmarkPortalReady(organisationId);
      setOrganisation(updated);
      toast.success('Portal marked not ready.');
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setPortalBusy(false);
    }
  };

  const handleResendEmail = async () => {
    setPortalBusy(true);
    try {
      const result = await organisationService.resendPortalEmail(organisationId, 'all');
      setOrganisation(result);
      const er = result.email_result;
      if (er?.failed?.length) {
        toast.error(`Sent ${er.sent}/${er.total}; some emails failed.`);
      } else {
        toast.success(`Resent portal details to ${er?.sent ?? 0} recipient(s).`);
      }
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setPortalBusy(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    setMemberBusy(true);
    try {
      const created = await organisationService.createMember(organisationId, {
        email: memberForm.email.trim(),
        phone_number: memberForm.phone_number.trim() || undefined,
        first_name: memberForm.first_name.trim() || undefined,
        last_name: memberForm.last_name.trim() || undefined,
        role_id: memberForm.role_id ? parseInt(memberForm.role_id, 10) : null,
        position: memberForm.position.trim() || undefined,
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
      setMemberForm({
        email: '',
        phone_number: '',
        first_name: '',
        last_name: '',
        role_id: '',
        position: '',
      });
      setShowAddMember(false);
      await fetchMembersAndRoles();
      const refreshed = await organisationService.getOrganisation(organisationId);
      setOrganisation(refreshed);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setMemberBusy(false);
    }
  };

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

  const ownerHasEmail = Boolean(organisation?.owner_details?.email?.trim());

  if (isLoading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-admin"></div>
              <p className="mt-4 text-gray-600">Loading organization...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (!organisation) {
    return null;
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-2">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/admin/organisations"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organisation.name}</h1>
                <p className="mt-2 text-sm text-gray-600">Organization Details</p>
              </div>
            </div>
          </div>

          {/* Portal readiness */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Client portal</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Ops checklist only — marking ready does not block login. Ready sends the portal URL by email.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {organisation.portal_ready ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Ready
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                      Not ready
                    </span>
                  )}
                  {organisation.portal_ready_at && (
                    <span className="text-xs text-gray-500">
                      since {new Date(organisation.portal_ready_at).toLocaleString()}
                    </span>
                  )}
                  {organisation.portal_welcome_sent_at && (
                    <span className="text-xs text-gray-500">
                      · last email {new Date(organisation.portal_welcome_sent_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="text-sm bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                    {organisation.portal_url || `https://${organisation.subdomain}.…`}
                  </code>
                  <button
                    type="button"
                    onClick={copyPortalUrl}
                    className="text-sm text-admin hover:text-admin-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
              {canUpdateOrganisations && (
                <div className="flex flex-col gap-2 shrink-0">
                  {!organisation.portal_ready ? (
                    <button
                      type="button"
                      disabled={portalBusy || !ownerHasEmail}
                      onClick={handleMarkReady}
                      className="px-4 py-2 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!ownerHasEmail ? 'Owner needs an email first' : undefined}
                    >
                      {portalBusy ? 'Working…' : 'Mark ready & email'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={portalBusy}
                        onClick={handleResendEmail}
                        className="px-4 py-2 text-sm font-medium text-admin border border-admin rounded-lg hover:bg-admin/10 disabled:opacity-50"
                      >
                        Resend portal details
                      </button>
                      <button
                        type="button"
                        disabled={portalBusy}
                        onClick={handleUnmarkReady}
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Mark not ready
                      </button>
                    </>
                  )}
                  {!ownerHasEmail && (
                    <p className="text-xs text-amber-700 max-w-xs">
                      Owner has no email — required before marking ready.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {!isEditing ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Organization Information</h2>
                  {canUpdateOrganisations && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-admin border border-admin rounded-lg hover:bg-admin/10 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{organisation.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
                    <dd className="mt-1 text-sm text-gray-900">{organisation.subdomain}</dd>
                    <p className="mt-1 text-xs text-gray-500">Subdomain cannot be changed after creation</p>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{organisation.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Plan</dt>
                    <dd className="mt-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeColor(organisation.plan)}`}>
                        {organisation.plan}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email Domain</dt>
                    <dd className="mt-1 text-sm text-gray-900">{organisation.email_domain || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Auth method</dt>
                    <dd className="mt-1">
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded capitalize">
                        {organisation.auth_method || 'local'}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Enabled modules</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {organisation.enabled_modules == null ? (
                        <span className="text-gray-700">All modules (not restricted to a subset)</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {organisation.enabled_modules.map((key) => (
                            <span
                              key={key}
                              className="px-2 py-1 text-xs font-mono bg-indigo-50 text-indigo-900 rounded border border-indigo-100"
                            >
                              {key}
                            </span>
                          ))}
                        </div>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(organisation.created).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Owner</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {organisation.owner_details ? (
                        <div>
                          <div className="font-medium">
                            {organisation.owner_details.full_name ||
                              `${organisation.owner_details.first_name || ''} ${organisation.owner_details.last_name || ''}`.trim() ||
                              'Owner'}
                          </div>
                          {organisation.owner_details.email && (
                            <div className="text-gray-500 text-xs mt-1">{organisation.owner_details.email}</div>
                          )}
                          {organisation.owner_details.phone_number && (
                            <div className="text-gray-500 text-xs">{organisation.owner_details.phone_number}</div>
                          )}
                          <div className="text-gray-400 text-xs mt-1">Account ID: {organisation.owner}</div>
                        </div>
                      ) : (
                        organisation.owner ? `Account ID: ${organisation.owner}` : 'No owner assigned'
                      )}
                    </dd>
                  </div>
                  {organisation.employee_count !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Employees</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {organisation.employee_count} employee{organisation.employee_count !== 1 ? 's' : ''}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(organisation.updated).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Edit Organization</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: organisation.name,
                          email: organisation.email,
                          plan: organisation.plan,
                          settings: organisation.settings || {},
                          email_domain: organisation.email_domain || null,
                          auth_method: organisation.auth_method || 'local',
                        });
                        setNewOwnerId(organisation.owner?.toString() || '');
                        applyModuleStateFromOrganisation(organisation);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                    <select
                      value={formData.plan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          plan: e.target.value as 'free' | 'pro' | 'enterprise',
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Domain</label>
                    <input
                      type="text"
                      value={formData.email_domain || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, email_domain: e.target.value || null })
                      }
                      placeholder="example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Auth method</label>
                    <div className="space-y-2">
                      {(['local', 'google', 'microsoft'] as const).map((method) => (
                        <label key={method} className="flex items-center">
                          <input
                            type="radio"
                            name="auth_method"
                            checked={formData.auth_method === method}
                            onChange={() => setFormData({ ...formData, auth_method: method })}
                            className="border-gray-300 text-admin focus:ring-admin"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Account ID
                    </label>
                    <input
                      type="number"
                      value={newOwnerId}
                      onChange={(e) => setNewOwnerId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                      placeholder="Enter account ID to change owner"
                    />
                  </div>

                  <OrganisationEnabledModulesFields
                    radioGroupName="org-detail-modules"
                    variant="edit"
                    modulesMode={modulesMode}
                    setModulesMode={setModulesMode}
                    enabledModuleKeys={enabledModuleKeys}
                    setEnabledModuleKeys={setEnabledModuleKeys}
                    moduleCatalog={moduleCatalog}
                    canLoadModuleCatalog={canLoadModuleCatalog}
                  />
                </div>
              </>
            )}
          </div>

          {/* Client portal users (tenant employees) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Client portal users</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Tenant employees who sign in to this org&apos;s client portal. Separate from Senan Staff (GLPI).
                </p>
              </div>
              {canUpdateOrganisations && (
                <button
                  type="button"
                  onClick={() => setShowAddMember((v) => !v)}
                  className="px-4 py-2 text-sm font-medium text-admin border border-admin rounded-lg hover:bg-admin/10"
                >
                  {showAddMember ? 'Cancel' : '+ Add member'}
                </button>
              )}
            </div>

            {showAddMember && (
              <form onSubmit={handleCreateMember} className="mb-6 p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="text"
                      value={memberForm.phone_number}
                      onChange={(e) => setMemberForm({ ...memberForm, phone_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                      placeholder="+233..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">First name</label>
                    <input
                      type="text"
                      value={memberForm.first_name}
                      onChange={(e) => setMemberForm({ ...memberForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last name</label>
                    <input
                      type="text"
                      value={memberForm.last_name}
                      onChange={(e) => setMemberForm({ ...memberForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                    <select
                      value={memberForm.role_id}
                      onChange={(e) => setMemberForm({ ...memberForm, role_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    >
                      <option value="">No role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                    <input
                      type="text"
                      value={memberForm.position}
                      onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {organisation.portal_ready
                    ? 'Portal is ready — this member will get a welcome email with the portal URL.'
                    : 'Portal is not ready yet — no email until you mark ready.'}
                </p>
                <button
                  type="submit"
                  disabled={memberBusy}
                  className="px-4 py-2 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50"
                >
                  {memberBusy ? 'Creating…' : 'Create member'}
                </button>
              </form>
            )}

            {membersLoading ? (
              <p className="text-sm text-gray-500">Loading members…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-500">No client portal users yet (owner may appear after create).</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 text-gray-900">{m.account_name}</td>
                        <td className="px-3 py-2 text-gray-600">{m.account_email || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{m.role_name || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{m.position || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
