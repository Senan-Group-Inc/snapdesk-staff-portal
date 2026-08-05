'use client';

import { useState, useEffect } from 'react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import organisationService from '@/services/organisation.service';
import { StaffOrganisation, PaginatedStaffOrganisationsResponse } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OrganisationsPage() {
  const { user } = useStaffAuth();
  const canCreateOrganisations = hasStaffPermission(user, STAFF_PERMISSIONS.CREATE_ORGANISATIONS);
  const [organisations, setOrganisations] = useState<StaffOrganisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<'free' | 'pro' | 'enterprise' | ''>('');
  const [filterPortalReady, setFilterPortalReady] = useState<'' | 'true' | 'false'>('');
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
    current_page: 1,
  });

  useEffect(() => {
    fetchOrganisations();
  }, [pagination.current_page, searchTerm, filterPlan, filterPortalReady]);

  const fetchOrganisations = async () => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        name?: string;
        plan?: 'free' | 'pro' | 'enterprise';
        portal_ready?: boolean;
      } = {
        page: pagination.current_page,
      };

      if (searchTerm) {
        params.name = searchTerm;
      }

      if (filterPlan) {
        params.plan = filterPlan;
      }

      if (filterPortalReady === 'true') {
        params.portal_ready = true;
      } else if (filterPortalReady === 'false') {
        params.portal_ready = false;
      }

      const response: PaginatedStaffOrganisationsResponse =
        await organisationService.listOrganisations(params);
      setOrganisations(response.data);
      setPagination({
        count: response.count,
        total_pages: response.total_pages,
        current_page: pagination.current_page,
      });
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
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

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage tenant organizations. Mark a portal ready when DNS/hosting is live, then emails go out.
            </p>
          </div>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by name or subdomain..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination({ ...pagination, current_page: 1 });
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <select
                value={filterPlan}
                onChange={(e) => {
                  setFilterPlan(e.target.value as '' | 'free' | 'pro' | 'enterprise');
                  setPagination({ ...pagination, current_page: 1 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              <select
                value={filterPortalReady}
                onChange={(e) => {
                  setFilterPortalReady(e.target.value as '' | 'true' | 'false');
                  setPagination({ ...pagination, current_page: 1 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-admin focus:border-admin"
              >
                <option value="">All portal status</option>
                <option value="true">Portal ready</option>
                <option value="false">Not ready</option>
              </select>
            </div>

            {canCreateOrganisations && (
              <Link
                href="/admin/organisations/new"
                className="px-4 py-2 bg-admin text-white rounded-lg hover:bg-admin-600 transition-colors font-medium"
              >
                + Create Organization
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin"></div>
              <p className="mt-4 text-gray-600">Loading organizations...</p>
            </div>
          ) : organisations.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">No organizations found</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subdomain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Portal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {organisations.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{org.subdomain}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {org.portal_ready ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Ready
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                              Not ready
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeColor(org.plan)}`}>
                            {org.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{org.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(org.created).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/organisations/${org.id}`}
                            className="text-admin hover:text-admin-600 transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.total_pages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.count} total)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination({ ...pagination, current_page: Math.max(1, pagination.current_page - 1) })}
                      disabled={pagination.current_page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, current_page: Math.min(pagination.total_pages, pagination.current_page + 1) })}
                      disabled={pagination.current_page === pagination.total_pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
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
