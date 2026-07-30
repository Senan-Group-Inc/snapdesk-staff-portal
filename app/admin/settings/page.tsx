'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffSettingsService from '@/services/staff-settings.service';
import { PlatformSettings, FeatureFlags } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';

interface SettingsFormData {
  platform_name: string;
  platform_email: string;
  platform_phone: string;
  max_organisations_per_user: number | null;
  max_users_per_organisation: number | null;
  max_tickets_per_organisation: number | null;
  email_from_address: string;
  email_from_name: string;
  sms_provider: string;
  sms_sender_id: string;
}

export default function SettingsPage() {
  const { user } = useStaffAuth();
  const canManageSettings = hasStaffPermission(user, STAFF_PERMISSIONS.MANAGE_PLATFORM_SETTINGS);
  // VIEW_PLATFORM_SETTINGS may not exist, so allow viewing if they can manage or are super admin
  const canViewSettings = canManageSettings || hasStaffPermission(user, STAFF_PERMISSIONS.SUPER_ADMIN);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'features'>('general');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormData>();

  useEffect(() => {
    if (canViewSettings || canManageSettings) {
      fetchSettings();
      fetchFeatureFlags();
    }
  }, [canViewSettings, canManageSettings]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await staffSettingsService.getCurrentSettings();
      setSettings(data);
      reset({
        platform_name: data.platform_name || '',
        platform_email: data.platform_email || '',
        platform_phone: data.platform_phone || '',
        max_organisations_per_user: data.max_organisations_per_user,
        max_users_per_organisation: data.max_users_per_organisation,
        max_tickets_per_organisation: data.max_tickets_per_organisation,
        email_from_address: data.email_from_address || '',
        email_from_name: data.email_from_name || '',
        sms_provider: data.sms_provider || '',
        sms_sender_id: data.sms_sender_id || '',
      });
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const data = await staffSettingsService.getFeatureFlags();
      setFeatureFlags(data);
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!canManageSettings) {
      toast.error('You do not have permission to update settings');
      return;
    }

    setIsSaving(true);
    try {
      await staffSettingsService.updateSettings({
        platform_name: data.platform_name || undefined,
        platform_email: data.platform_email || undefined,
        platform_phone: data.platform_phone || undefined,
        max_organisations_per_user: data.max_organisations_per_user,
        max_users_per_organisation: data.max_users_per_organisation,
        max_tickets_per_organisation: data.max_tickets_per_organisation,
        email_from_address: data.email_from_address || undefined,
        email_from_name: data.email_from_name || undefined,
        sms_provider: data.sms_provider || undefined,
        sms_sender_id: data.sms_sender_id || undefined,
      });
      toast.success('Settings updated successfully');
      fetchSettings();
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = async (feature: keyof FeatureFlags, currentValue: boolean) => {
    if (!canManageSettings) {
      toast.error('You do not have permission to update feature flags');
      return;
    }

    try {
      await staffSettingsService.toggleFeature({
        feature: feature as any,
        enabled: !currentValue,
      });
      toast.success(`Feature ${feature} ${!currentValue ? 'enabled' : 'disabled'}`);
      fetchFeatureFlags();
    } catch (error: any) {
      toast.error(handleApiError(error));
    }
  };

  if (!canViewSettings && !canManageSettings) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-sm text-gray-500">
                You don't have permission to manage platform settings.
              </p>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage platform-wide settings and configuration
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'general'
                    ? 'border-admin text-admin'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                General Settings
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'features'
                    ? 'border-admin text-admin'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Feature Flags
              </button>
            </nav>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin"></div>
              <p className="mt-4 text-sm text-gray-500">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* General Settings Tab */}
              {activeTab === 'general' && settings && (
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                  </div>
                  <div className="px-6 py-6 space-y-6">
                    {/* Platform Info */}
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-gray-900">Platform Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platform Name
                        </label>
                        <input
                          {...register('platform_name')}
                          type="text"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platform Email
                        </label>
                        <input
                          {...register('platform_email')}
                          type="email"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platform Phone
                        </label>
                        <input
                          {...register('platform_phone')}
                          type="tel"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-gray-900">Limits</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Organisations per User (leave empty for unlimited)
                        </label>
                        <input
                          {...register('max_organisations_per_user', { valueAsNumber: true })}
                          type="number"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Users per Organisation (leave empty for unlimited)
                        </label>
                        <input
                          {...register('max_users_per_organisation', { valueAsNumber: true })}
                          type="number"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Tickets per Organisation (leave empty for unlimited)
                        </label>
                        <input
                          {...register('max_tickets_per_organisation', { valueAsNumber: true })}
                          type="number"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                    </div>

                    {/* Email Settings */}
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-gray-900">Email Settings</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email From Address
                        </label>
                        <input
                          {...register('email_from_address')}
                          type="email"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email From Name
                        </label>
                        <input
                          {...register('email_from_name')}
                          type="text"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                    </div>

                    {/* SMS Settings */}
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-gray-900">SMS Settings</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMS Provider
                        </label>
                        <input
                          {...register('sms_provider')}
                          type="text"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMS Sender ID
                        </label>
                        <input
                          {...register('sms_sender_id')}
                          type="text"
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                          disabled={!canManageSettings}
                        />
                      </div>
                    </div>

                    {canManageSettings && (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-6 py-2 bg-admin text-white rounded-lg hover:bg-admin-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* Feature Flags Tab */}
              {activeTab === 'features' && featureFlags && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Feature Flags</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Enable or disable platform features
                    </p>
                  </div>
                  <div className="px-6 py-6 space-y-4">
                    {Object.entries(featureFlags).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {feature.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFeature(feature as keyof FeatureFlags, enabled)}
                          disabled={!canManageSettings}
                          className={`
                            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-admin focus:ring-offset-2
                            ${enabled ? 'bg-admin' : 'bg-gray-200'}
                            ${!canManageSettings ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <span
                            className={`
                              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                              ${enabled ? 'translate-x-5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
