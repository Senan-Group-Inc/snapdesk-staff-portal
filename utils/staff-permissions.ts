import { StaffUser } from '@/types';

/**
 * Staff permission constants
 * These should match the permissions defined in the backend
 */
export const STAFF_PERMISSIONS = {
  SUPER_ADMIN: 'super_admin',
  MANAGE_ORGANISATIONS: 'manage_organisations',
  VIEW_ORGANISATIONS: 'view_organisations',
  CREATE_ORGANISATIONS: 'create_organisations',
  UPDATE_ORGANISATIONS: 'update_organisations',
  MANAGE_STAFF: 'manage_staff',
  VIEW_STAFF: 'view_staff',
  CREATE_STAFF: 'create_staff',
  UPDATE_STAFF: 'update_staff',
  DELETE_STAFF: 'delete_staff',
  MANAGE_STAFF_ROLES: 'manage_staff_roles',
  VIEW_STAFF_ROLES: 'view_staff_roles',
  CREATE_STAFF_ROLES: 'create_staff_roles',
  UPDATE_STAFF_ROLES: 'update_staff_roles',
  DELETE_STAFF_ROLES: 'delete_staff_roles',
  MANAGE_STAFF_PERMISSIONS: 'manage_staff_permissions',
  VIEW_STAFF_PERMISSIONS: 'view_staff_permissions',
  CREATE_STAFF_PERMISSIONS: 'create_staff_permissions',
  UPDATE_STAFF_PERMISSIONS: 'update_staff_permissions',
  DELETE_STAFF_PERMISSIONS: 'delete_staff_permissions',
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics',
  EXPORT_PLATFORM_REPORTS: 'export_platform_reports',
  MANAGE_PLATFORM_SETTINGS: 'manage_platform_settings',
  VIEW_PLATFORM_SETTINGS: 'view_platform_settings',
  VIEW_PRODUCT_MODULES: 'view_product_modules',
  MANAGE_PRODUCT_MODULES: 'manage_product_modules',
} as const;

/**
 * Get permissions array from staff user
 * Checks both staff_profile.permissions and legacy user.permissions
 */
function getStaffPermissions(user: StaffUser | null): string[] {
  if (!user) {
    if (typeof window !== 'undefined') {
      console.log('getStaffPermissions: user is null');
    }
    return [];
  }
  
  // Prefer staff_profile.permissions (actual API structure)
  if (user.staff_profile?.permissions && Array.isArray(user.staff_profile.permissions)) {
    if (typeof window !== 'undefined') {
      console.log('getStaffPermissions: Using staff_profile.permissions', {
        count: user.staff_profile.permissions.length,
        permissions: user.staff_profile.permissions,
        hasSuperAdmin: user.staff_profile.permissions.includes('super_admin'),
      });
    }
    return user.staff_profile.permissions;
  }
  
  // Fallback to legacy user.permissions (documentation structure)
  if (user.permissions && Array.isArray(user.permissions)) {
    if (typeof window !== 'undefined') {
      console.log('getStaffPermissions: Using legacy user.permissions', {
        count: user.permissions.length,
        permissions: user.permissions,
        hasSuperAdmin: user.permissions.includes('super_admin'),
      });
    }
    return user.permissions;
  }
  
  if (typeof window !== 'undefined') {
    console.error('getStaffPermissions: No permissions found!', {
      hasStaffProfile: !!user.staff_profile,
      staffProfileType: typeof user.staff_profile,
      staffProfileKeys: user.staff_profile ? Object.keys(user.staff_profile) : [],
      hasPermissions: !!user.permissions,
      permissionsType: typeof user.permissions,
      userKeys: Object.keys(user),
      fullUser: user,
    });
  }
  
  return [];
}

/**
 * Check if staff user has a specific permission
 * 
 * Super admin permission grants access to all operations.
 * Permissions are stored in staff_profile.permissions or user.permissions array from the API response.
 */
export function hasStaffPermission(
  user: StaffUser | null,
  permissionName: string
): boolean {
  const permissions = getStaffPermissions(user);
  if (permissions.length === 0) return false;
  
  // Super admin has all permissions
  if (permissions.includes(STAFF_PERMISSIONS.SUPER_ADMIN)) {
    return true;
  }
  
  return permissions.includes(permissionName);
}

/**
 * Check if staff user has any of the given permissions
 */
export function hasAnyStaffPermission(
  user: StaffUser | null,
  permissionNames: string[]
): boolean {
  const permissions = getStaffPermissions(user);
  if (permissions.length === 0) return false;
  
  if (permissions.includes(STAFF_PERMISSIONS.SUPER_ADMIN)) {
    return true;
  }
  
  return permissionNames.some((perm) => permissions.includes(perm));
}

/**
 * Check if staff user has all of the given permissions
 */
export function hasAllStaffPermissions(
  user: StaffUser | null,
  permissionNames: string[]
): boolean {
  const permissions = getStaffPermissions(user);
  if (permissions.length === 0) return false;
  
  if (permissions.includes(STAFF_PERMISSIONS.SUPER_ADMIN)) {
    return true;
  }
  
  return permissionNames.every((perm) => permissions.includes(perm));
}

