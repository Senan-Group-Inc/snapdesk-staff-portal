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
} from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';
import OrganisationEnabledModulesFields, {
  ORGANISATION_CORE_MODULE_KEY,
} from '@/components/OrganisationEnabledModulesFields';
import { ModalSelect } from '@/components/ui';

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
  const [memberCount, setMemberCount] = useState<number | null>(null);

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

  useEffect(() => {
    if (organisationId) {
      fetchOrganisation();
    }
  }, [organisationId]);

  useEffect(() => {
    if (organisationId && user) {
      loadModuleCatalog();
      organisationService
        .listMembers(organisationId)
        .then((list) => setMemberCount(list.length))
        .catch(() => setMemberCount(null));
    }
  }, [organisationId, user, loadModuleCatalog]);

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
        <div className="w-full space-y-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/admin/organisations/${organisationId}/portal`}
              className="group bg-white rounded-lg border border-gray-200 p-5 hover:border-admin/40 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-admin">
                    Client portal
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Readiness checklist and welcome emails
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-admin shrink-0 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-4">
                {organisation.portal_ready ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Ready
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                    Not ready
                  </span>
                )}
              </div>
            </Link>

            <Link
              href={`/admin/organisations/${organisationId}/members`}
              className="group bg-white rounded-lg border border-gray-200 p-5 hover:border-admin/40 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-admin">
                    Client portal users
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Tenant employees for this org&apos;s portal
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-admin shrink-0 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-4">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {memberCount === null
                    ? '…'
                    : `${memberCount} member${memberCount === 1 ? '' : 's'}`}
                </span>
              </div>
            </Link>
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
                    <ModalSelect
                      label="Plan"
                      labelVisible
                      value={formData.plan || 'free'}
                      onChange={(v) =>
                        setFormData({
                          ...formData,
                          plan: v as 'free' | 'pro' | 'enterprise',
                        })
                      }
                      options={[
                        { value: 'free', label: 'Free' },
                        { value: 'pro', label: 'Pro' },
                        { value: 'enterprise', label: 'Enterprise' },
                      ]}
                    />
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

        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
