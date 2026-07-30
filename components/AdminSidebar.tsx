'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { hasStaffPermission, hasAnyStaffPermission, STAFF_PERMISSIONS } from '@/utils/staff-permissions';
import {
  BuildingOfficeIcon,
  LogoutIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  KeyIcon,
  ModuleGridIcon,
} from './icons';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** If set, user needs at least one of these permissions (or super_admin). */
  anyPermissions?: string[];
  permission?: string;
}

const adminNavigation: NavItem[] = [
  {
    name: 'Organizations',
    href: '/admin/organisations',
    icon: BuildingOfficeIcon,
    permission: STAFF_PERMISSIONS.VIEW_ORGANISATIONS,
  },
  {
    name: 'Senan team',
    href: '/admin/staff',
    icon: UsersIcon,
    permission: STAFF_PERMISSIONS.VIEW_STAFF,
  },
  {
    name: 'Staff Roles',
    href: '/admin/staff/roles',
    icon: ShieldCheckIcon,
    permission: STAFF_PERMISSIONS.VIEW_STAFF_ROLES,
  },
  {
    name: 'Staff Permissions',
    href: '/admin/staff/permissions',
    icon: KeyIcon,
    permission: STAFF_PERMISSIONS.VIEW_STAFF_PERMISSIONS,
  },
  {
    name: 'Product modules',
    href: '/admin/modules',
    icon: ModuleGridIcon,
    anyPermissions: [
      STAFF_PERMISSIONS.VIEW_PRODUCT_MODULES,
      STAFF_PERMISSIONS.MANAGE_PRODUCT_MODULES,
      STAFF_PERMISSIONS.MANAGE_ORGANISATIONS,
    ],
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    permission: STAFF_PERMISSIONS.VIEW_PLATFORM_ANALYTICS,
  },
  {
    name: 'Platform Settings',
    href: '/admin/settings',
    icon: CogIcon,
    permission: STAFF_PERMISSIONS.MANAGE_PLATFORM_SETTINGS,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useStaffAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Debug: Log user and permissions
  if (typeof window !== 'undefined' && user) {
    console.log('AdminSidebar - User:', user);
    console.log('AdminSidebar - Staff Profile:', user.staff_profile);
    console.log('AdminSidebar - Permissions:', user.staff_profile?.permissions || user.permissions);
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200 shadow-sm
          transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          flex flex-col h-screen
        `}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">
            Service Desk Admin
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {adminNavigation
            .filter((item) => {
              if (item.anyPermissions?.length) {
                return hasAnyStaffPermission(user, item.anyPermissions);
              }
              if (item.permission) {
                const hasPermission = hasStaffPermission(user, item.permission);
                if (typeof window !== 'undefined') {
                  console.log(`AdminSidebar - Checking ${item.name} (${item.permission}):`, hasPermission);
                }
                return hasPermission;
              }
              return true;
            })
            .map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (item.href !== pathname) {
                      router.prefetch(item.href);
                    }
                  }}
                  onMouseEnter={() => {
                    if (item.href !== pathname) {
                      router.prefetch(item.href);
                    }
                  }}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? 'bg-admin text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center px-4 py-3 mb-2">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-admin flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || (user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email || 'Admin User')}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.staff_profile?.role_name || user?.role_name || 'Staff Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogoutIcon className="mr-2 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

