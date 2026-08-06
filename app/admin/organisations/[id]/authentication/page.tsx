'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

type PanelMode = 'list' | 'pick' | 'form';
type AuthMethodKey = 'local' | OAuthProvider;

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

function methodLabel(key: AuthMethodKey): string {
  if (key === 'local') return 'Email code';
  if (key === 'microsoft') return 'Microsoft';
  return 'Google';
}

function methodHint(key: AuthMethodKey): string {
  if (key === 'local') return 'One-time code sent to the member email.';
  if (key === 'microsoft') return 'Microsoft Entra ID / Azure AD.';
  return 'Google Workspace / Google OAuth.';
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
  const [togglingMethod, setTogglingMethod] = useState<AuthMethodKey | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>('list');
  const [formProvider, setFormProvider] = useState<OAuthProvider | null>(null);
  const [formIsAdd, setFormIsAdd] = useState(false);

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

  const listedMethods = useMemo(() => {
    if (!settings) return [] as AuthMethodKey[];
    const rows: AuthMethodKey[] = [];
    if (settings.allowed_auth_methods.includes('local')) {
      rows.push('local');
    }
    for (const provider of ['microsoft', 'google'] as OAuthProvider[]) {
      const row = settings.providers[provider];
      const enabled = settings.allowed_auth_methods.includes(provider);
      if (enabled || row.configured) {
        rows.push(provider);
      }
    }
    return rows;
  }, [settings]);

  const addableMethods = useMemo(() => {
    if (!settings) return [] as AuthMethodKey[];
    const options: AuthMethodKey[] = [];
    if (!settings.allowed_auth_methods.includes('local')) {
      options.push('local');
    }
    for (const provider of ['microsoft', 'google'] as OAuthProvider[]) {
      if (!settings.providers[provider].configured) {
        options.push(provider);
      }
    }
    return options;
  }, [settings]);

  const updateDraft = (provider: OAuthProvider, patch: Partial<ProviderDraft>) => {
    setDrafts((prev) => ({ ...prev, [provider]: { ...prev[provider], ...patch } }));
  };

  const setMethodEnabled = async (method: AuthMethodKey, enabled: boolean) => {
    if (!canUpdate || !settings) return;
    if (method !== 'local') {
      const row = settings.providers[method];
      if (enabled && !row.configured) {
        toast.error('Save OAuth credentials before enabling this method');
        return;
      }
    }
    const next = new Set(settings.allowed_auth_methods);
    if (enabled) next.add(method);
    else next.delete(method);
    if (next.size === 0) {
      toast.error('Keep at least one sign-in method');
      return;
    }
    setTogglingMethod(method);
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
        enabled ? `${methodLabel(method)} enabled` : `${methodLabel(method)} disabled`
      );
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setTogglingMethod(null);
    }
  };

  const saveProvider = async (provider: OAuthProvider, enableAfterSave: boolean) => {
    if (!canUpdate || !settings) return;
    const draft = drafts[provider];
    if (!draft.client_id.trim()) {
      toast.error('Client ID is required');
      return;
    }
    const existing = settings.providers[provider];
    if (!existing?.has_client_secret && !draft.client_secret.trim()) {
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
      let nextSettings: OrganisationAuthSettingsResponse = {
        ...settings,
        providers: { ...settings.providers, [provider]: updated },
      };
      setDrafts((prev) => ({
        ...prev,
        [provider]: draftFromProvider(updated),
      }));

      if (enableAfterSave && !settings.allowed_auth_methods.includes(provider)) {
        const next = new Set(settings.allowed_auth_methods);
        next.add(provider);
        nextSettings = await organisationService.updateAuthAllowedMethods(
          organisationId,
          Array.from(next) as Array<'local' | 'google' | 'microsoft'>
        );
        setDrafts({
          microsoft: draftFromProvider(nextSettings.providers.microsoft),
          google: draftFromProvider(nextSettings.providers.google),
        });
        toast.success(`${methodLabel(provider)} added`);
      } else {
        toast.success(`${methodLabel(provider)} credentials saved`);
      }
      setSettings(nextSettings);
      setPanelMode('list');
      setFormProvider(null);
      setFormIsAdd(false);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setSavingProvider(null);
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

  const openAdd = () => {
    setPanelMode('pick');
    setFormProvider(null);
    setFormIsAdd(false);
  };

  const chooseAddType = async (key: AuthMethodKey) => {
    if (key === 'local') {
      await setMethodEnabled('local', true);
      setPanelMode('list');
      return;
    }
    setFormProvider(key);
    setFormIsAdd(true);
    setPanelMode('form');
    const suggested = settings?.providers[key].suggested_redirect_uri || '';
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...emptyDraft(),
        redirect_uri: suggested,
      },
    }));
  };

  const openConfigure = (provider: OAuthProvider) => {
    if (!settings) return;
    setFormProvider(provider);
    setFormIsAdd(false);
    setPanelMode('form');
    setDrafts((prev) => ({
      ...prev,
      [provider]: draftFromProvider(settings.providers[provider]),
    }));
  };

  const backToList = () => {
    setPanelMode('list');
    setFormProvider(null);
    setFormIsAdd(false);
  };

  const renderProviderForm = (provider: OAuthProvider) => {
    if (!settings) return null;
    const row = settings.providers[provider];
    const draft = drafts[provider];
    const title = methodLabel(provider);
    const redirectUri = draft.redirect_uri || row.suggested_redirect_uri;

    return (
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <button
            type="button"
            onClick={backToList}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center min-h-[44px]"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {formIsAdd ? `Add ${title}` : `Configure ${title}`}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{methodHint(provider)}</p>
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
              Client secret {row.has_client_secret && !formIsAdd ? '' : <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={draft.client_secret}
              disabled={!canUpdate}
              onChange={(e) => updateDraft(provider, { client_secret: e.target.value })}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin focus:border-admin disabled:bg-gray-50"
              placeholder={
                row.has_client_secret && !formIsAdd
                  ? 'Leave blank to keep the current secret'
                  : 'Paste client secret'
              }
              autoComplete="new-password"
            />
            {row.has_client_secret && !formIsAdd ? (
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
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={backToList}
              className="px-5 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveProvider(provider, formIsAdd)}
              disabled={savingProvider === provider}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-admin hover:bg-admin-600 rounded-lg disabled:opacity-50 min-h-[44px]"
            >
              {savingProvider === provider
                ? 'Saving...'
                : formIsAdd
                  ? `Add ${title}`
                  : 'Save credentials'}
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
        <div className="w-full space-y-8">
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

          {panelMode === 'list' ? (
            <section className="bg-white border border-gray-200 rounded-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sign-in methods</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Methods enabled for members, plus any OAuth apps you have configured.
                  </p>
                </div>
                {canUpdate && addableMethods.length > 0 ? (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-admin hover:bg-admin-600 rounded-lg min-h-[44px]"
                  >
                    Add method
                  </button>
                ) : null}
              </div>

              {listedMethods.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <h3 className="text-base font-semibold text-gray-900">No methods yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add email codes, Microsoft, or Google so members can sign in.
                  </p>
                  {canUpdate ? (
                    <button
                      type="button"
                      onClick={openAdd}
                      className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-admin hover:bg-admin-600 rounded-lg min-h-[44px]"
                    >
                      Add method
                    </button>
                  ) : null}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {listedMethods.map((method) => {
                    const enabled =
                      method === 'local'
                        ? settings.allowed_auth_methods.includes('local')
                        : settings.allowed_auth_methods.includes(method);
                    const configured =
                      method === 'local' ? true : settings.providers[method].configured;

                    return (
                      <li
                        key={method}
                        className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">
                              {methodLabel(method)}
                            </p>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                enabled
                                  ? 'border-green-200 text-green-800 bg-green-50'
                                  : 'border-gray-200 text-gray-600 bg-gray-50'
                              }`}
                            >
                              {enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{methodHint(method)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          {method !== 'local' && canUpdate ? (
                            <button
                              type="button"
                              onClick={() => openConfigure(method)}
                              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]"
                            >
                              Configure
                            </button>
                          ) : null}
                          {canUpdate ? (
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 min-h-[44px] px-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4 border-gray-300 text-admin focus:ring-admin"
                                checked={enabled}
                                disabled={
                                  togglingMethod === method ||
                                  (method !== 'local' && !configured && !enabled)
                                }
                                onChange={(e) => void setMethodEnabled(method, e.target.checked)}
                              />
                              Enabled for members
                            </label>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}

          {panelMode === 'pick' ? (
            <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div>
                <button
                  type="button"
                  onClick={backToList}
                  className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center min-h-[44px]"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Add sign-in method</h2>
                <p className="mt-1 text-sm text-gray-500">Choose the type to configure next.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addableMethods.map((key) => (
                  <button
                    key={key}
                    type="button"
                    disabled={togglingMethod === key}
                    onClick={() => void chooseAddType(key)}
                    className="text-left border border-gray-200 rounded-lg p-5 hover:border-admin hover:bg-admin/5 transition-colors min-h-[44px]"
                  >
                    <p className="text-sm font-semibold text-gray-900">{methodLabel(key)}</p>
                    <p className="mt-1 text-sm text-gray-500">{methodHint(key)}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {panelMode === 'form' && formProvider ? renderProviderForm(formProvider) : null}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
