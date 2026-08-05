'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { HubCard, SummaryCard } from '@/components/dashboard/cards';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  HomeIcon,
  KeyIcon,
  ModuleGridIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@/components/icons';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasAnyStaffPermission, hasStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import staffAnalyticsService from '@/services/staff-analytics.service';
import organisationService from '@/services/organisation.service';
import { PlatformGrowth, PlatformOverview } from '@/types';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#2563EB', '#60A5FA', '#93C5FD', '#1D4ED8', '#F59E0B', '#10B981', '#EF4444'];

export default function AdminDashboardPage() {
  const { user } = useStaffAuth();
  const canViewAnalytics = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_PLATFORM_ANALYTICS);
  const canViewOrgs = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_ORGANISATIONS);
  const canViewStaff = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF);
  const canViewRoles = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF_ROLES);
  const canViewPermissions = hasStaffPermission(user, STAFF_PERMISSIONS.VIEW_STAFF_PERMISSIONS);
  const canViewModules = hasAnyStaffPermission(user, [
    STAFF_PERMISSIONS.VIEW_PRODUCT_MODULES,
    STAFF_PERMISSIONS.MANAGE_PRODUCT_MODULES,
    STAFF_PERMISSIONS.MANAGE_ORGANISATIONS,
  ]);

  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [growth, setGrowth] = useState<PlatformGrowth | null>(null);
  const [fallbackPortal, setFallbackPortal] = useState<{ ready: number; not_ready: number; total: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        if (canViewAnalytics) {
          const [ov, gr] = await Promise.all([
            staffAnalyticsService.getPlatformOverview(),
            staffAnalyticsService.getPlatformGrowth({ days: 30 }),
          ]);
          if (!cancelled) {
            setOverview(ov);
            setGrowth(gr);
          }
        } else if (canViewOrgs) {
          const res = await organisationService.listOrganisations({ page: 1, count: 500 });
          if (!cancelled) {
            const ready = res.data.filter((o) => o.portal_ready).length;
            setFallbackPortal({
              ready,
              not_ready: res.data.length - ready,
              total: res.count || res.data.length,
            });
          }
        }
      } catch (error: unknown) {
        toast.error(handleApiError(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canViewAnalytics, canViewOrgs]);

  const planChartData = useMemo(
    () =>
      (overview?.organisations_by_plan || []).map((item) => ({
        name: item.plan,
        value: item.count,
      })),
    [overview]
  );

  const ticketChartData = useMemo(() => {
    if (!overview) return [];
    return [
      { name: 'Open', value: overview.ticket_status.open },
      { name: 'In progress', value: overview.ticket_status.in_progress },
      { name: 'Resolved', value: overview.ticket_status.resolved },
      { name: 'Closed', value: overview.ticket_status.closed },
    ];
  }, [overview]);

  const portalReady = overview?.portal_status?.ready ?? fallbackPortal?.ready;
  const portalNotReady = overview?.portal_status?.not_ready ?? fallbackPortal?.not_ready;

  const hubs = [
    canViewOrgs && {
      href: '/admin/organisations',
      title: 'Organizations',
      description: 'Tenants, portal readiness, and client portal users',
      status:
        portalReady != null && portalNotReady != null
          ? `${portalReady} ready · ${portalNotReady} not ready`
          : undefined,
      icon: BuildingOfficeIcon,
    },
    canViewStaff && {
      href: '/admin/staff',
      title: 'Senan team',
      description: 'Staff accounts and GLPI engine logins',
      status: overview ? `${overview.totals.staff} staff` : undefined,
      icon: UsersIcon,
    },
    canViewRoles && {
      href: '/admin/staff/roles',
      title: 'Staff Roles',
      description: 'Role definitions and permission bundles',
      icon: ShieldCheckIcon,
    },
    canViewPermissions && {
      href: '/admin/staff/permissions',
      title: 'Staff Permissions',
      description: 'Permission catalog for staff roles',
      icon: KeyIcon,
    },
    canViewModules && {
      href: '/admin/modules',
      title: 'Product modules',
      description: 'Catalog pricing and labels for tenant module pickers',
      icon: ModuleGridIcon,
    },
    canViewAnalytics && {
      href: '/admin/analytics',
      title: 'Analytics',
      description: 'Detailed platform reports and breakdowns',
      icon: ChartBarIcon,
    },
  ].filter(Boolean) as Array<{
    href: string;
    title: string;
    description: string;
    status?: string;
    icon: typeof HomeIcon;
  }>;

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="w-full space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Staff ops snapshot: organizations, portal readiness, team, and platform activity
            </p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-admin" />
              <p className="mt-4 text-sm text-gray-600">Loading dashboard…</p>
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {(overview || fallbackPortal) && (
                    <SummaryCard
                      label="Organizations"
                      value={overview?.totals.organisations ?? fallbackPortal?.total ?? 0}
                      hint={
                        overview
                          ? `${overview.recent_activity_30_days.new_organisations} new in 30 days`
                          : undefined
                      }
                    />
                  )}
                  {(portalReady != null || portalNotReady != null) && (
                    <SummaryCard
                      label="Portal ready"
                      value={portalReady ?? 0}
                      hint={`${portalNotReady ?? 0} not ready`}
                    />
                  )}
                  {overview && (
                    <>
                      <SummaryCard
                        label="Client portal users"
                        value={overview.totals.employees}
                        hint={`${overview.recent_activity_30_days.new_employees} new in 30 days`}
                      />
                      <SummaryCard
                        label="Open tickets"
                        value={overview.ticket_status.open}
                        hint={`${overview.ticket_status.in_progress} in progress`}
                      />
                    </>
                  )}
                  {!overview && !fallbackPortal && (
                    <div className="sm:col-span-2 xl:col-span-4 bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
                      No summary metrics available for your permissions. Use the hubs below to get started.
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Quick links
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {hubs.map((hub) => (
                    <HubCard key={hub.href} {...hub} />
                  ))}
                  {hubs.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3 bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
                      No sections are available on your account. Ask an admin to grant staff permissions.
                    </div>
                  )}
                </div>
              </section>

              {overview && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      Charts
                    </h2>
                    <Link href="/admin/analytics" className="text-sm font-medium text-admin hover:text-admin-600">
                      Full analytics
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Organizations by plan
                      </h3>
                      <div className="h-64">
                        {planChartData.length === 0 ? (
                          <p className="text-sm text-gray-500">No plan data yet.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={planChartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={2}
                              >
                                {planChartData.map((_, idx) => (
                                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Tickets by status</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ticketChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {growth && (
                      <div className="bg-white rounded-lg border border-gray-200 p-5 xl:col-span-2">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">
                          Growth (last {growth.period.days} days)
                        </h3>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growth.daily_growth}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) =>
                                  typeof v === 'string' ? v.slice(5) : String(v)
                                }
                              />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="organisations"
                                name="Organizations"
                                stroke="#2563EB"
                                strokeWidth={2}
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="employees"
                                name="Portal users"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="tickets"
                                name="Tickets"
                                stroke="#F59E0B"
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
