import staffApiClient from '@/lib/staff-api-client';
import {
  StaffOrganisation,
  CreateStaffOrganisationRequest,
  UpdateStaffOrganisationRequest,
  PaginatedStaffOrganisationsResponse,
  StaffOrganisationMember,
  CreateStaffOrganisationMemberRequest,
  UpdateStaffOrganisationMemberRequest,
  StaffOrganisationRole,
  MarkPortalReadyResponse,
  OrganisationAuthSettingsResponse,
  AuthProviderSettingsPublic,
  UpsertAuthProviderRequest,
} from '@/types';

/**
 * Staff organisation routes use trailing slashes (SimpleRouter trailing_slash=True).
 */
class OrganisationService {
  async listOrganisations(params?: {
    name?: string;
    subdomain?: string;
    plan?: 'free' | 'pro' | 'enterprise';
    portal_ready?: boolean;
    page?: number;
    count?: number;
  }): Promise<PaginatedStaffOrganisationsResponse> {
    const response = await staffApiClient.get<PaginatedStaffOrganisationsResponse>(
      '/organisation/',
      { params }
    );
    return response.data;
  }

  async getOrganisation(id: number): Promise<StaffOrganisation> {
    const response = await staffApiClient.get<StaffOrganisation>(`/organisation/${id}/`);
    return response.data;
  }

  async getOrganisationDetails(id: number): Promise<StaffOrganisation> {
    const response = await staffApiClient.get<StaffOrganisation>(
      `/organisation/${id}/details/`
    );
    return response.data;
  }

  async createOrganisation(
    data: CreateStaffOrganisationRequest
  ): Promise<StaffOrganisation> {
    const response = await staffApiClient.post<StaffOrganisation>('/organisation/', data);
    return response.data;
  }

  async updateOrganisation(
    id: number,
    data: UpdateStaffOrganisationRequest
  ): Promise<StaffOrganisation> {
    const response = await staffApiClient.patch<StaffOrganisation>(
      `/organisation/${id}/`,
      data
    );
    return response.data;
  }

  async updateOrganisationFull(
    id: number,
    data: UpdateStaffOrganisationRequest
  ): Promise<StaffOrganisation> {
    const response = await staffApiClient.put<StaffOrganisation>(
      `/organisation/${id}/`,
      data
    );
    return response.data;
  }

  async markPortalReady(id: number): Promise<MarkPortalReadyResponse> {
    const response = await staffApiClient.post<MarkPortalReadyResponse>(
      `/organisation/${id}/mark-portal-ready/`
    );
    return response.data;
  }

  async unmarkPortalReady(id: number): Promise<StaffOrganisation> {
    const response = await staffApiClient.post<StaffOrganisation>(
      `/organisation/${id}/unmark-portal-ready/`
    );
    return response.data;
  }

  async resendPortalEmail(
    id: number,
    include: 'all' | 'owner' = 'all'
  ): Promise<MarkPortalReadyResponse> {
    const response = await staffApiClient.post<MarkPortalReadyResponse>(
      `/organisation/${id}/resend-portal-email/`,
      { include }
    );
    return response.data;
  }

  async listMembers(orgId: number): Promise<StaffOrganisationMember[]> {
    const response = await staffApiClient.get<StaffOrganisationMember[]>(
      `/organisation/${orgId}/members/`
    );
    return response.data;
  }

  async createMember(
    orgId: number,
    data: CreateStaffOrganisationMemberRequest
  ): Promise<StaffOrganisationMember> {
    const response = await staffApiClient.post<StaffOrganisationMember>(
      `/organisation/${orgId}/members/`,
      data
    );
    return response.data;
  }

  async getMember(orgId: number, memberId: number): Promise<StaffOrganisationMember> {
    const response = await staffApiClient.get<StaffOrganisationMember>(
      `/organisation/${orgId}/members/${memberId}/`
    );
    return response.data;
  }

  async updateMember(
    orgId: number,
    memberId: number,
    data: UpdateStaffOrganisationMemberRequest
  ): Promise<StaffOrganisationMember> {
    const response = await staffApiClient.patch<StaffOrganisationMember>(
      `/organisation/${orgId}/members/${memberId}/`,
      data
    );
    return response.data;
  }

  async deleteMembers(
    orgId: number,
    ids: number[]
  ): Promise<{ deleted: number; skipped_owner: number; not_found: number[] }> {
    const response = await staffApiClient.post<{
      deleted: number;
      skipped_owner: number;
      not_found: number[];
    }>(`/organisation/${orgId}/members/bulk-delete/`, { ids });
    return response.data;
  }

  async deleteOrganisation(id: number): Promise<void> {
    await staffApiClient.delete(`/organisation/${id}/`);
  }

  async listRoles(orgId: number): Promise<StaffOrganisationRole[]> {
    const response = await staffApiClient.get<StaffOrganisationRole[]>(
      `/organisation/${orgId}/roles/`
    );
    return response.data;
  }

  /**
   * GET /organisation/<id>/auth-settings/
   */
  async getAuthSettings(orgId: number): Promise<OrganisationAuthSettingsResponse> {
    const response = await staffApiClient.get<OrganisationAuthSettingsResponse>(
      `/organisation/${orgId}/auth-settings/`
    );
    return response.data;
  }

  /**
   * PATCH /organisation/<id>/auth-settings/
   */
  async updateAuthAllowedMethods(
    orgId: number,
    allowed_auth_methods: Array<'local' | 'google' | 'microsoft'>
  ): Promise<OrganisationAuthSettingsResponse> {
    const response = await staffApiClient.patch<OrganisationAuthSettingsResponse>(
      `/organisation/${orgId}/auth-settings/`,
      { allowed_auth_methods }
    );
    return response.data;
  }

  /**
   * PUT /organisation/<id>/auth-settings/<provider>/
   */
  async upsertAuthProvider(
    orgId: number,
    provider: 'google' | 'microsoft',
    data: UpsertAuthProviderRequest
  ): Promise<AuthProviderSettingsPublic> {
    const response = await staffApiClient.put<AuthProviderSettingsPublic>(
      `/organisation/${orgId}/auth-settings/${provider}/`,
      data
    );
    return response.data;
  }
}

export const organisationService = new OrganisationService();
export default organisationService;
