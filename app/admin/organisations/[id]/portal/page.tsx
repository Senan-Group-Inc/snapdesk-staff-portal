'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { ConfirmModal } from '@/components/ui';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import { StaffOrganisation } from '@/types';
import { handleApiError } from '@/utils/error-handler';

type PortalConfirm = 'ready' | 'unready' | 'resend' | null;

export default function OrganisationPortalPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useStaffAuth();
  const organisationId = parseInt(params.id as string, 10);
  const canUpdate = hasStaffPermission(user, STAFF_PERMISSIONS.UPDATE_ORGANISATIONS);

  const [organisation, setOrganisation] = useState<StaffOrganisation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);
  const [confirm, setConfirm] = useState<PortalConfirm>(null);

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

  const ownerEmail = organisation?.owner_details?.email?.trim() || '';
  const ownerHasEmail = Boolean(ownerEmail);
  const recipientCount = organisation?.portal_email_recipient_count ?? 0;
  const portalUrl =
    organisation?.portal_url ||
    (organisation?.subdomain ? `https://${organisation.subdomain}.…` : '');

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

  const closeConfirm = () => {
    if (!portalBusy) setConfirm(null);
  };

  const handleMarkReady = async () => {
    if (!organisation) return;
    setPortalBusy(true);
    try {
      const result = await organisationService.markPortalReady(organisationId);
      setOrganisation(result);
      setConfirm(null);
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
    setPortalBusy(true);
    try {
      setOrganisation(await organisationService.unmarkPortalReady(organisationId));
      setConfirm(null);
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
      setConfirm(null);
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

  const emailRecipientsBody = (
    <div className="space-y-3 text-sm text-gray-700">
      <p>
        {recipientCount > 0 ? (
          <>
            This will email{' '}
            <span className="font-semibold text-gray-900">
              {recipientCount} recipient{recipientCount === 1 ? '' : 's'}
            </span>{' '}
            the portal URL and sign-in instructions.
          </>
        ) : (
          <>
            This will email the organisation owner (and any members with addresses) the
            portal URL and sign-in instructions.
          </>
        )}
      </p>
      {ownerEmail && (
        <p>
          Owner:{' '}
          <span className="font-mono text-gray-900">{ownerEmail}</span>
          {recipientCount > 1 ? ' and other members with email.' : '.'}
        </p>
      )}
      {portalUrl && (
        <p>
          Portal URL:{' '}
          <code className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs">
            {portalUrl}
          </code>
        </p>
      )}
    </div>
  );

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/organisations/${organisationId}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
              </svg>
              Back
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
                    Ops checklist only. Marking ready does not block login. Ready sends the
                    portal URL by email.
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
                  <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                    {!organisation.portal_ready ? (
                      <button
                        type="button"
                        disabled={portalBusy || !ownerHasEmail}
                        onClick={() => setConfirm('ready')}
                        className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-admin rounded-lg hover:bg-admin-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!ownerHasEmail ? 'Owner needs an email first' : undefined}
                      >
                        Mark ready & email
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={portalBusy}
                          onClick={() => setConfirm('resend')}
                          className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-admin border border-admin rounded-lg hover:bg-admin/10 disabled:opacity-50"
                        >
                          Resend portal details
                        </button>
                        <button
                          type="button"
                          disabled={portalBusy}
                          onClick={() => setConfirm('unready')}
                          className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          Mark not ready
                        </button>
                      </>
                    )}
                    {!ownerHasEmail && (
                      <p className="text-xs text-amber-700 max-w-xs sm:text-right">
                        Owner has no email. Required before marking ready.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ConfirmModal
          open={confirm === 'ready'}
          onClose={closeConfirm}
          onConfirm={handleMarkReady}
          title="Mark portal ready"
          description="This updates the ops checklist and sends welcome emails."
          confirmLabel="Mark ready & email"
          busy={portalBusy}
        >
          {emailRecipientsBody}
        </ConfirmModal>

        <ConfirmModal
          open={confirm === 'resend'}
          onClose={closeConfirm}
          onConfirm={handleResendEmail}
          title="Resend portal details"
          description="Send the portal URL and sign-in instructions again."
          confirmLabel="Send emails"
          busy={portalBusy}
        >
          {emailRecipientsBody}
        </ConfirmModal>

        <ConfirmModal
          open={confirm === 'unready'}
          onClose={closeConfirm}
          onConfirm={handleUnmarkReady}
          title="Mark portal not ready"
          description="This updates the ops checklist only."
          confirmLabel="Mark not ready"
          variant="danger"
          busy={portalBusy}
        >
          <p className="text-sm text-gray-700">
            People can still sign in. Access is not revoked. No email is sent.
          </p>
        </ConfirmModal>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
