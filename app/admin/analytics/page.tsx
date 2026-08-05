'use client';

import { useState, useEffect } from 'react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffAnalyticsService from '@/services/staff-analytics.service';
import { PlatformOverview, OrganisationAnalytics, TicketAnalytics, UserAnalytics } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const { user } = useStaffAuth();
  const canViewAnalytics = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_PLATFORM_ANALYTICS);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [orgAnalytics, setOrgAnalytics] = useState<OrganisationAnalytics | null>(null);
  const [ticketAnalytics, setTicketAnalytics] = useState<TicketAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'organisations' | 'tickets' | 'users'>('overview');

  useEffect(() => {
    if (canViewAnalytics) {
      fetchData();
    }
  }, [canViewAnalytics, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'overview':
          const overviewData = await staffAnalyticsService.getPlatformOverview();
          setOverview(overviewData);
          break;
        case 'organisations':
          const orgData = await staffAnalyticsService.getOrganisationAnalytics();
          setOrgAnalytics(orgData);
          break;
        case 'tickets':
          const ticketData = await staffAnalyticsService.getTicketAnalytics();
          setTicketAnalytics(ticketData);
          break;
        case 'users':
          const userData = await staffAnalyticsService.getUserAnalytics();
          setUserAnalytics(userData);
          break;
      }
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (!canViewAnalytics) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="w-full">
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-sm text-gray-500">
                You don't have permission to view platform analytics.
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
        <div className="w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="mt-2 text-sm text-gray-600">
              View platform-wide analytics and reports
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(['overview', 'organisations', 'tickets', 'users'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm capitalize
                    ${activeTab === tab
                      ? 'border-admin text-admin'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin"></div>
              <p className="mt-4 text-sm text-gray-500">Loading analytics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && overview && (
                <div className="space-y-6">
                  {/* Totals */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Object.entries(overview.totals).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="text-sm font-medium text-gray-500 capitalize mb-1">
                          {key.replace('_', ' ')}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (30 Days)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {Object.entries(overview.recent_activity_30_days).map(([key, value]) => (
                        <div key={key}>
                          <div className="text-sm font-medium text-gray-500 capitalize mb-1">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xl font-bold text-gray-900">{value.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket Status */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {Object.entries(overview.ticket_status).map(([status, count]) => (
                        <div key={status}>
                          <div className="text-sm font-medium text-gray-500 capitalize mb-1">
                            {status.replace('_', ' ')}
                          </div>
                          <div className="text-xl font-bold text-gray-900">{count.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Organisations by Plan */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organisations by Plan</h3>
                    <div className="space-y-2">
                      {overview.organisations_by_plan.map((item) => (
                        <div key={item.plan} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{item.plan}</span>
                          <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Organisations Tab */}
              {activeTab === 'organisations' && orgAnalytics && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organisations by Plan</h3>
                    <div className="space-y-2">
                      {orgAnalytics.by_plan.map((item) => (
                        <div key={item.plan} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{item.plan}</span>
                          <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Organisations by Tickets</h3>
                    <div className="space-y-3">
                      {orgAnalytics.top_by_tickets.map((org) => (
                        <div key={org.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{org.name}</div>
                            <div className="text-sm text-gray-500">{org.subdomain}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{org.ticket_count}</div>
                            <div className="text-xs text-gray-500 capitalize">{org.plan}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tickets Tab */}
              {activeTab === 'tickets' && ticketAnalytics && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Status</h3>
                    <div className="space-y-2">
                      {ticketAnalytics.by_status.map((item) => (
                        <div key={item.status} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{item.status}</span>
                          <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
                    <div className="space-y-2">
                      {ticketAnalytics.by_priority.map((item) => (
                        <div key={item.priority} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{item.priority}</span>
                          <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-sm font-medium text-gray-500 mb-1">Average Resolution Time</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {ticketAnalytics.average_resolution_time_hours.toFixed(1)} hours
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && userAnalytics && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Account Type</h3>
                    <div className="space-y-2">
                      {userAnalytics.by_account_type.map((item) => (
                        <div key={item.account_type} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{item.account_type.replace('_', ' ')}</span>
                          <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Verification Status</h3>
                    <div className="space-y-2">
                      {userAnalytics.by_verification_status.map((item) => (
                        <div key={item.verification_status} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{item.verification_status}</span>
                          <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
