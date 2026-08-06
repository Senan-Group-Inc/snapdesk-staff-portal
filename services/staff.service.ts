import staffApiClient from '@/lib/staff-api-client';
import {
  StaffPermissionList,
  PaginatedStaffPermissionsResponse,
  CreateStaffPermissionRequest,
  UpdateStaffPermissionRequest,
  StaffRoleList,
  StaffRoleDetail,
  PaginatedStaffRolesResponse,
  CreateStaffRoleRequest,
  UpdateStaffRoleRequest,
  AssignPermissionsRequest,
  RemovePermissionsRequest,
  StaffProfileList,
  StaffProfileDetail,
  PaginatedStaffProfilesResponse,
  CreateStaffProfileRequest,
  UpdateStaffProfileRequest,
  AssignRoleRequest,
  CreateStaffWithGlpiRequest,
  CreateStaffWithGlpiResponse,
  ProvisionGlpiRequest,
  ProvisionGlpiResponse,
} from '@/types';

/**
 * Staff Management Service
 * 
 * Handles all staff-related API endpoints including:
 * - Staff Permissions (CRUD)
 * - Staff Roles (CRUD, assign/remove permissions)
 * - Staff Profiles (CRUD, assign/remove roles)
 */
class StaffService {
  private basePath = '/staff';

  // ==================== Staff Permissions ====================

  /**
   * List all staff permissions
   * GET /api/v1/staff/staff/permissions
   */
  async listPermissions(params?: {
    page?: number;
    count?: number;
  }): Promise<PaginatedStaffPermissionsResponse> {
    const response = await staffApiClient.get<PaginatedStaffPermissionsResponse>(
      `${this.basePath}/permissions`,
      { params }
    );
    return response.data;
  }

  /**
   * Get permission details by ID
   * GET /api/v1/staff/staff/permissions/{id}
   */
  async getPermission(id: number): Promise<StaffPermissionList> {
    const response = await staffApiClient.get<StaffPermissionList>(
      `${this.basePath}/permissions/${id}`
    );
    return response.data;
  }

  /**
   * Create a new permission
   * POST /api/v1/staff/staff/permissions
   */
  async createPermission(data: CreateStaffPermissionRequest): Promise<StaffPermissionList> {
    const response = await staffApiClient.post<StaffPermissionList>(
      `${this.basePath}/permissions`,
      data
    );
    return response.data;
  }

  /**
   * Update permission (partial update)
   * PATCH /api/v1/staff/staff/permissions/{id}
   */
  async updatePermission(
    id: number,
    data: UpdateStaffPermissionRequest
  ): Promise<StaffPermissionList> {
    const response = await staffApiClient.patch<StaffPermissionList>(
      `${this.basePath}/permissions/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Update permission (full update)
   * PUT /api/v1/staff/staff/permissions/{id}
   */
  async updatePermissionFull(
    id: number,
    data: UpdateStaffPermissionRequest
  ): Promise<StaffPermissionList> {
    const response = await staffApiClient.put<StaffPermissionList>(
      `${this.basePath}/permissions/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete permission
   * DELETE /api/v1/staff/staff/permissions/{id}
   */
  async deletePermission(id: number): Promise<void> {
    await staffApiClient.delete(`${this.basePath}/permissions/${id}`);
  }

  // ==================== Staff Roles ====================

  /**
   * List all staff roles
   * GET /api/v1/staff/staff/roles
   */
  async listRoles(params?: {
    name?: string;
    permission?: number;
    page?: number;
    count?: number;
  }): Promise<PaginatedStaffRolesResponse> {
    const response = await staffApiClient.get<PaginatedStaffRolesResponse>(
      `${this.basePath}/roles`,
      { params }
    );
    return response.data;
  }

  /**
   * Get role details by ID
   * GET /api/v1/staff/staff/roles/{id}
   */
  async getRole(id: number): Promise<StaffRoleDetail> {
    const response = await staffApiClient.get<StaffRoleDetail>(
      `${this.basePath}/roles/${id}`
    );
    return response.data;
  }

  /**
   * Create a new role
   * POST /api/v1/staff/staff/roles
   */
  async createRole(data: CreateStaffRoleRequest): Promise<StaffRoleDetail> {
    const response = await staffApiClient.post<StaffRoleDetail>(
      `${this.basePath}/roles`,
      data
    );
    return response.data;
  }

  /**
   * Update role (partial update)
   * PATCH /api/v1/staff/staff/roles/{id}
   */
  async updateRole(id: number, data: UpdateStaffRoleRequest): Promise<StaffRoleDetail> {
    const response = await staffApiClient.patch<StaffRoleDetail>(
      `${this.basePath}/roles/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Update role (full update)
   * PUT /api/v1/staff/staff/roles/{id}
   */
  async updateRoleFull(id: number, data: UpdateStaffRoleRequest): Promise<StaffRoleDetail> {
    const response = await staffApiClient.put<StaffRoleDetail>(
      `${this.basePath}/roles/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete role
   * DELETE /api/v1/staff/staff/roles/{id}
   */
  async deleteRole(id: number): Promise<void> {
    await staffApiClient.delete(`${this.basePath}/roles/${id}`);
  }

  /**
   * Assign permissions to role
   * POST /api/v1/staff/staff/roles/{id}/assign_permissions
   */
  async assignPermissionsToRole(
    id: number,
    data: AssignPermissionsRequest
  ): Promise<StaffRoleDetail> {
    const response = await staffApiClient.post<StaffRoleDetail>(
      `${this.basePath}/roles/${id}/assign_permissions`,
      data
    );
    return response.data;
  }

  /**
   * Remove permissions from role
   * POST /api/v1/staff/staff/roles/{id}/remove_permissions
   */
  async removePermissionsFromRole(
    id: number,
    data: RemovePermissionsRequest
  ): Promise<StaffRoleDetail> {
    const response = await staffApiClient.post<StaffRoleDetail>(
      `${this.basePath}/roles/${id}/remove_permissions`,
      data
    );
    return response.data;
  }

  // ==================== Staff Profiles ====================

  /**
   * List all staff profiles
   * GET /api/v1/staff/staff/profiles
   */
  async listProfiles(params?: {
    role?: number;
    search?: string;
    permission?: number;
    page?: number;
    count?: number;
  }): Promise<PaginatedStaffProfilesResponse> {
    const response = await staffApiClient.get<PaginatedStaffProfilesResponse>(
      `${this.basePath}/profiles`,
      { params }
    );
    return response.data;
  }

  /**
   * Get staff profile details by ID
   * GET /api/v1/staff/staff/profiles/{id}
   */
  async getProfile(id: number): Promise<StaffProfileDetail> {
    const response = await staffApiClient.get<StaffProfileDetail>(
      `${this.basePath}/profiles/${id}`
    );
    return response.data;
  }

  /**
   * Get current staff member's profile
   * GET /api/v1/staff/staff/profiles/me
   */
  async getCurrentProfile(): Promise<StaffProfileDetail> {
    const response = await staffApiClient.get<StaffProfileDetail>(
      `${this.basePath}/profiles/me`
    );
    return response.data;
  }

  /**
   * Create a new staff profile
   * POST /api/v1/staff/staff/profiles
   */
  async createProfile(data: CreateStaffProfileRequest): Promise<StaffProfileDetail> {
    const response = await staffApiClient.post<StaffProfileDetail>(
      `${this.basePath}/profiles`,
      data
    );
    return response.data;
  }

  /**
   * Update staff profile (partial update)
   * PATCH /api/v1/staff/staff/profiles/{id}
   */
  async updateProfile(id: number, data: UpdateStaffProfileRequest): Promise<StaffProfileDetail> {
    const response = await staffApiClient.patch<StaffProfileDetail>(
      `${this.basePath}/profiles/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Update staff profile (full update)
   * PUT /api/v1/staff/staff/profiles/{id}
   */
  async updateProfileFull(id: number, data: UpdateStaffProfileRequest): Promise<StaffProfileDetail> {
    const response = await staffApiClient.put<StaffProfileDetail>(
      `${this.basePath}/profiles/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete staff profile
   * DELETE /api/v1/staff/staff/profiles/{id}
   */
  async deleteProfile(id: number): Promise<void> {
    await staffApiClient.delete(`${this.basePath}/profiles/${id}`);
  }

  /**
   * Create Senan Service Desk staff and provision a matching GLPI login
   * POST /api/v1/staff/staff/profiles/create_with_glpi
   */
  async createStaffWithGlpi(
    data: CreateStaffWithGlpiRequest
  ): Promise<CreateStaffWithGlpiResponse> {
    const response = await staffApiClient.post<CreateStaffWithGlpiResponse>(
      `${this.basePath}/profiles/create_with_glpi`,
      data
    );
    return response.data;
  }

  /**
   * Provision (or link) a GLPI user for an existing staff profile
   * POST /api/v1/staff/staff/profiles/{id}/provision_glpi
   */
  async provisionGlpi(
    id: number,
    data: ProvisionGlpiRequest = {}
  ): Promise<ProvisionGlpiResponse> {
    const response = await staffApiClient.post<ProvisionGlpiResponse>(
      `${this.basePath}/profiles/${id}/provision_glpi`,
      data
    );
    return response.data;
  }

  /**
   * Assign role to staff member
   * POST /api/v1/staff/staff/profiles/{id}/assign_role
   */
  async assignRoleToProfile(id: number, data: AssignRoleRequest): Promise<StaffProfileDetail> {
    const response = await staffApiClient.post<StaffProfileDetail>(
      `${this.basePath}/profiles/${id}/assign_role`,
      data
    );
    return response.data;
  }

  /**
   * Remove role from staff member
   * POST /api/v1/staff/staff/profiles/{id}/remove_role
   */
  async removeRoleFromProfile(id: number): Promise<StaffProfileDetail> {
    const response = await staffApiClient.post<StaffProfileDetail>(
      `${this.basePath}/profiles/${id}/remove_role`
    );
    return response.data;
  }
}

export const staffService = new StaffService();
export default staffService;
