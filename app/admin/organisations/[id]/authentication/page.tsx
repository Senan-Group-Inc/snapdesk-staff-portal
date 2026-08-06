'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import {
  AuthProviderSettingsPublic,
  OAuthProvider,
  OrganisationAuthSettingsResponse,
  StaffOrganisation,
} from '@/types';
import { handleApiError } from '@/utils/error-handler';

type ProviderDraft = {
  client_id: string;
  client_secret: string;
  authority: string;
  redirect_uri: string;
};

const emptyDraft = (): ProviderDraft => ({
  client_id: '',
  client_secret: '',
  authority: '',
  redirect_uri: '',
});

function draftFromProvider(p: AuthProviderSettingsPublic): ProviderDraft {
  return {
    client_id: p.client_id || '',
    client_secret: '',
    authority: p.authority || '',
    redirect_uri: p.redirect_uri || p.suggested_redirect_uri || '',
  };
}

export default function OrganisationAuthenticationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useStaffAuth();
  const organisationId = parseInt(params.id as string, 10);
  const canUpdate = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_ORGANISATIONS);

  const [organisation, setOrganisation] = useState<StaffOrganisation | null>(null);
  const [settings, setSettings] = useState<OrganisationAuthSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<OAuthProvider, ProviderDraft>>({
    microsoft: emptyDraft(),
    google: emptyDraft(),
  });
  const [savingProvider, setSavingProvider] = useState<OAuthProvider | null>(null);
  const [togglingProvider, setTogglingProvider] = useState<OAuthProvider | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [org, auth] = await Promise.all([
        organisationService.getOrganisation(organisationId),
        organisationService.getAuthSettings(organisationId),
      ]);
      setOrganisation(org);
      setSettings(auth);
      setDrafts({
        microsoft: draftFromProvider(auth.providers.microsoft),
        google: draftFromProvider(auth.providers.google),
      });
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      router.push('/admin/organisations');
    } finally {
      setIsLoading(false);
    }
  }, [organisationId, router]);

  useEffect(() => {
    if (organisationId) void load();
  }, [organisationId, load]);

  const updateDraft = (provider: OAuthProvider, patch: Partial<ProviderDraft>) => {
    setDrafts((prev) => ({ ...prev, [provider]: { ...prev[provider], ...patch } }));
  };

  const saveProvider = async (provider: OAuthProvider) => {
    if (!canUpdate || !settings) return;
    const draft = drafts[provider];
    if (!draft.client_id.trim()) {
      toast.error('Client ID is required');
      return;
    }
    const existing = settings.providers[provider];
    if (!existing.has_client_secret && !draft.client_secret.trim()) {
      toast.error('Client secret is required for the first save');
      return;
    }
    setSavingProvider(provider);
    try {
      const payload: {
        client_id: string;
        client_secret?: string;
        authority?: string;
        redirect_uri?: string;
      } = {
        client_id: draft.client_id.trim(),
        authority: draft.authority.trim(),
        redirect_uri: draft.redirect_uri.trim() || undefined,
      };
      if (draft.client_secret.trim()) {
        payload.client_secret = draft.client_secret.trim();
      }
      const updated = await organisationService.upsertAuthProvider(
        organisationId,
        provider,
        payload
      );
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              providers: { ...prev.providers, [provider]: updated },
            }
          : prev
      );
      setDrafts((prev) => ({
        ...prev,
        [provider]: draftFromProvider(updated),
      }));
      toast.success(`${provider === 'microsoft' ? 'Microsoft' : 'Google'} credentials saved`);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setSavingProvider(null);
    }
  };

  const setProviderEnabled = async (provider: OAuthProvider, enabled: boolean) => {
    if (!canUpdate || !settings) return;
    const row = settings.providers[provider];
    if (enabled && !row.configured) {
      toast.error('Save OAuth credentials before enabling this method');
      return;
    }
    const next = new Set(settings.allowed_auth_methods);
    next.add('local');
    if (enabled) next.add(provider);
    else next.delete(provider);
    setTogglingProvider(provider);
    try {
      const data = await organisationService.updateAuthAllowedMethods(
        organisationId,
        Array.from(next) as Array<'local' | 'google' | 'microsoft'>
      );
      setSettings(data);
      setDrafts({
        microsoft: draftFromProvider(data.providers.microsoft),
        google: draftFromProvider(data.providers.google),
      });
      toast.success(
        enabled
          ? `${provider === 'microsoft' ? 'Microsoft' : 'Google'} sign-in enabled`
          : `${provider === 'microsoft' ? 'Microsoft' : 'Google'} sign-in disabled`
      );
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setTogglingProvider(null);
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const renderProvider = (provider: OAuthProvider, title: string, hint: string) => {
    if (!settings) return null;
    const row = settings.providers[provider];
    const draft = drafts[provider];
    const enabled = settings.allowed_auth_methods.includes(provider);
    const redirectUri = draft.redirect_uri || row.suggested_redirect_uri;

    return (
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{hint}</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 border-gray-300 text-admin focus:ring-admin"
              checked={enabled}
              disabled={!canUpdate || togglingProvider === provider || (!row.configured && !enabled)}
              onChange={(e) => void setProviderEnabled(provider, e.target.checked)}
            />
            Enabled for members
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Redirect URI (register this in {title})
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={redirectUri}
              readOnly={!canUpdate}
              onChange={(e) => updateDraft(provider, { redirect_uri: e.target.value })}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-admin focus:border-admin"
            />
            <button
              type="button"
              onClick={() => void copyText(redirectUri)}
              className="px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Suggested: {row.suggested_redirect_uri}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={draft.client_id}
              disabled={!canUpdate}
              onChange={(e) => updateDraft(provider, { client_id: e.target.value })}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin focus:border-admin disabled:bg-gray-50"
              placeholder="Application (client) ID"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client secret {row.has_client_secret ? '' : <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={draft.client_secret}
              disabled={!canUpdate}
              onChange={(e) => updateDraft(provider, { client_secret: e.target.value })}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin focus:border-admin disabled:bg-gray-50"
              placeholder={
                row.has_client_secret
                  ? 'Leave blank to keep the current secret'
                  : 'Paste client secret'
              }
              autoComplete="new-password"
            />
            {row.has_client_secret ? (
              <p className="mt-2 text-xs text-gray-500">A secret is already stored (write-only).</p>
            ) : null}
          </div>
          {provider === 'microsoft' ? (
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Authority (tenant URL)
              </label>
              <input
                type="text"
                value={draft.authority}
                disabled={!canUpdate}
                onChange={(e) => updateDraft(provider, { authority: e.target.value })}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin focus:border-admin disabled:bg-gray-50"
                placeholder="https://login.microsoftonline.com/<TENANT_ID>"
              />
            </div>
          ) : null}
        </div>

        {canUpdate ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void saveProvider(provider)}
              disabled={savingProvider === provider}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-admin hover:bg-admin-600 rounded-lg disabled:opacity-50 min-h-[44px]"
            >
              {savingProvider === provider ? 'Saving...' : 'Save credentials'}
            </button>
          </div>
        ) : null}
      </section>
    );
  };

  if (isLoading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-admin" />
              <p className="mt-4 text-gray-600">Loading authentication settings...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (!organisation || !settings) {
    return null;
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full max-w-3xl space-y-8">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href={`/admin/organisations/${organisationId}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Authentication</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {organisation.name} · how portal members sign in
                </p>
              </div>
            </div>
          </div>

          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900">Email code</h2>
            <p className="mt-1 text-sm text-gray-500">
              Members can always sign in with a one-time code sent to their email.
            </p>
            <p className="mt-4 text-sm font-medium text-gray-700">Always on</p>
          </section>

          {renderProvider(
            'microsoft',
            'Microsoft',
            'Microsoft Entra ID / Azure AD for this organisation.'
          )}
          {renderProvider('google', 'Google', 'Google Workspace / Google OAuth for this organisation.')}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
