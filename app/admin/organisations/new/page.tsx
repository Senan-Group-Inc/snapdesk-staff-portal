'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import OrganisationEnabledModulesFields, {
  ORGANISATION_CORE_MODULE_KEY,
} from '@/components/OrganisationEnabledModulesFields';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasAnyStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import productModuleService from '@/services/product-module.service';
import { CreateStaffOrganisationRequest, ProductModule } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ModalSelect } from '@/components/ui';

type Step = 1 | 2;

export default function NewOrganisationPage() {
  const router = useRouter();
  const { user } = useStaffAuth();
  const canLoadModuleCatalog = hasAnyStaffPermission(user, [
    STAFF_PERMISSIONS.VIEW_PRODUCT_MODULES,
    STAFF_PERMISSIONS.MANAGE_ORGANISATIONS,
  ]);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [ownerData, setOwnerData] = useState({
    phone_number: '',
    email: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    gender: '' as 'male' | 'female' | '',
    country: '',
    address_line_1: '',
  });
  const [formData, setFormData] = useState<CreateStaffOrganisationRequest>({
    name: '',
    subdomain: '',
    email: '',
    plan: 'free',
    settings: {},
    email_domain: null,
    auth_method: 'local',
    country: '',
    address_line_1: '',
  });
  const [moduleCatalog, setModuleCatalog] = useState<ProductModule[]>([]);
  const [modulesMode, setModulesMode] = useState<'all' | 'custom'>('all');
  const [enabledModuleKeys, setEnabledModuleKeys] = useState<string[]>([
    ORGANISATION_CORE_MODULE_KEY,
  ]);

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
    if (user) {
      loadModuleCatalog();
    }
  }, [user, loadModuleCatalog]);

  // Step 1: Validate and move to step 2
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerData.email?.trim()) {
      toast.error('Owner email is required');
      return;
    }

    // Move to step 2
    setCurrentStep(2);
  };

  // Step 2: Submit organization creation
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name) {
      toast.error('Organization name is required');
      return;
    }
    
    if (!formData.subdomain) {
      toast.error('Subdomain is required');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the request data with owner_data
      const cleanOwnerData: Record<string, string> = {};
      if (ownerData.phone_number?.trim()) {
        cleanOwnerData.phone_number = ownerData.phone_number.trim();
      }
      if (ownerData.email?.trim()) cleanOwnerData.email = ownerData.email.trim();
      if (ownerData.first_name) cleanOwnerData.first_name = ownerData.first_name;
      if (ownerData.last_name) cleanOwnerData.last_name = ownerData.last_name;
      if (ownerData.middle_name) cleanOwnerData.middle_name = ownerData.middle_name;
      if (ownerData.gender) cleanOwnerData.gender = ownerData.gender;
      if (ownerData.country) cleanOwnerData.country = ownerData.country;
      if (ownerData.address_line_1) cleanOwnerData.address_line_1 = ownerData.address_line_1;

      const requestData: CreateStaffOrganisationRequest = {
        ...formData,
        owner_data: cleanOwnerData,
      };
      if (modulesMode === 'custom') {
        requestData.enabled_modules = [...enabledModuleKeys].sort();
      }

      const organisation = await organisationService.createOrganisation(requestData);
      
      // The API should return the organization with an id field
      if (!organisation || !organisation.id) {
        console.error('Organisation response missing ID. Full response:', JSON.stringify(organisation, null, 2));
        toast.error('Organization created but ID not found in response. Redirecting to list...');
        router.push('/admin/organisations');
        return;
      }
      
      toast.success(
        'Organization created. Mark the portal ready when DNS/hosting is live — then we email them the portal URL.'
      );
      router.push(`/admin/organisations/${organisation.id}`);
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full">
          {/* Header */}
          <div className="mb-8">
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
                <h1 className="text-3xl font-bold text-gray-900">Create Organization</h1>
                <p className="mt-2 text-sm text-gray-600">Add a new organization to the platform</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                {/* Step 1: Owner */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      currentStep >= 1
                        ? 'bg-admin border-admin text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > 1 ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">1</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${currentStep >= 1 ? 'text-admin' : 'text-gray-400'}`}>
                    Owner Account
                  </span>
                </div>

                {/* Connector */}
                <div className={`w-16 h-1 mx-2 mt-[-20px] rounded-full transition-colors ${currentStep >= 2 ? 'bg-admin' : 'bg-gray-200'}`} />

                {/* Step 2: Organization */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      currentStep >= 2
                        ? 'bg-admin border-admin text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    <span className="text-sm font-semibold">2</span>
                  </div>
                  <span className={`mt-2 text-xs font-medium ${currentStep >= 2 ? 'text-admin' : 'text-gray-400'}`}>
                    Organization
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1: Owner Account */}
            {currentStep === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Owner Account</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Create the business owner account. The owner will automatically receive the "Super Admin" role when the organization is created.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={ownerData.email}
                    onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    placeholder="owner@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required for portal-ready emails. Phone is optional.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={ownerData.phone_number}
                    onChange={(e) => setOwnerData({ ...ownerData, phone_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    placeholder="+1234567890"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional. Must be unique if provided.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={ownerData.first_name}
                      onChange={(e) => setOwnerData({ ...ownerData, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={ownerData.last_name}
                      onChange={(e) => setOwnerData({ ...ownerData, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={ownerData.middle_name}
                    onChange={(e) => setOwnerData({ ...ownerData, middle_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                  />
                </div>

                <div>
                  <ModalSelect
                    label="Gender"
                    labelVisible
                    value={ownerData.gender}
                    onChange={(v) =>
                      setOwnerData({ ...ownerData, gender: v as 'male' | 'female' | '' })
                    }
                    placeholder="Select gender"
                    options={[
                      { value: '', label: 'Select gender' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Owner Address (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={ownerData.country}
                        onChange={(e) => setOwnerData({ ...ownerData, country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                        placeholder="US"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={ownerData.address_line_1}
                        onChange={(e) => setOwnerData({ ...ownerData, address_line_1: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                        placeholder="123 Main St"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <Link
                    href="/admin/organisations"
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 transition-colors"
                  >
                    Continue to Organization
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Organization Details */}
            {currentStep === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Organization Details</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Enter the organization information. The owner account will be linked to this organization.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    placeholder="acme"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Subdomain must be unique and cannot be changed after creation. Only lowercase letters, numbers, and hyphens.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                    placeholder="admin@example.com"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Domain
                  </label>
                  <input
                    type="text"
                    value={formData.email_domain || ''}
                    onChange={(e) => setFormData({ ...formData, email_domain: e.target.value || null })}
                    placeholder="example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auth method
                  </label>
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

                <OrganisationEnabledModulesFields
                  radioGroupName="org-create-modules"
                  variant="create"
                  modulesMode={modulesMode}
                  setModulesMode={setModulesMode}
                  enabledModuleKeys={enabledModuleKeys}
                  setEnabledModuleKeys={setEnabledModuleKeys}
                  moduleCatalog={moduleCatalog}
                  canLoadModuleCatalog={canLoadModuleCatalog}
                />

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Organization Address (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country || ''}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value || undefined })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                        placeholder="US"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={formData.address_line_1 || ''}
                        onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value || undefined })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                        placeholder="123 Main St"
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Owner Account Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-2 font-medium text-gray-900">{ownerData.phone_number || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium text-gray-900">{ownerData.email || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {[ownerData.first_name, ownerData.middle_name, ownerData.last_name].filter(Boolean).join(' ') || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Gender:</span>
                      <span className="ml-2 font-medium text-gray-900 capitalize">{ownerData.gender || 'Not set'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="mt-3 text-sm text-admin hover:text-admin-600 transition-colors"
                  >
                    ← Edit Owner Details
                  </button>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Creating...' : 'Create Organization'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}

