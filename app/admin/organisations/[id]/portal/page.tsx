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
import { StaffOrganisation } from '@/types';
import { handleApiError } from '@/utils/error-handler';

export default function OrganisationPortalPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useStaffAuth();
  const organisationId = parseInt(params.id as string, 10);
  const canUpdate = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_ORGANISATIONS);

  const [organisation, setOrganisation] = useState<StaffOrganisation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await organisationService.getOrganisation(organisationId);
      setOrganisation(data);
    } catch (error: unknown) {
      toast.error(handleApiError(error));
      router.push('/admin/organisations');
    } finally {
      setIsLoading(false);
    }
  }, [organisationId, router]);

  useEffect(() => {
    if (organisationId) load();
  }, [organisationId, load]);

  const ownerHasEmail = Boolean(organisation?.owner_details?.email?.trim());

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
    if (
      !window.confirm(
        `Mark portal ready and email ${n || 'owner/members'} with the portal URL and sign-in instructions?`
      )
    ) {
      return;
    }
    setPortalBusy(true);
    try {
      const result = await organisationService.markPortalReady(organisationId);
      setOrganisation(result);
      const er = result.email_result;
      if (er?.failed?.length) {
        toast.error(`Portal marked ready. Sent ${er.sent}/${er.total}; ${er.failed.length} failed.`);
      } else {
        toast.success(`Portal marked ready. Emailed ${er?.sent ?? 0} recipient(s).`);
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
      setOrganisation(await organisationService.unmarkPortalReady(organisationId));
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

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full space-y-6">
          <div className="flex items-center space-x-4">
            <Link
              href={`/admin/organisations/${organisationId}`}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client portal</h1>
              <p className="mt-1 text-sm text-gray-600">
                {organisation?.name || 'Organization'} · readiness and welcome emails
              </p>
            </div>
          </div>

          {isLoading || !organisation ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin" />
              <p className="mt-4 text-gray-600">Loading…</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Ops checklist only. Marking ready does not block login. Ready sends the portal URL by email.
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
                {canUpdate && (
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
                        Owner has no email. Required before marking ready.
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
