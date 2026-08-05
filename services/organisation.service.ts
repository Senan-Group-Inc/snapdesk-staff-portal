import staffApiClient from '@/lib/staff-api-client';
import {
  StaffOrganisation,
  CreateStaffOrganisationRequest,
  UpdateStaffOrganisationRequest,
  PaginatedStaffOrganisationsResponse,
  StaffOrganisationMember,
  CreateStaffOrganisationMemberRequest,
  StaffOrganisationRole,
  MarkPortalReadyResponse,
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

  async listRoles(orgId: number): Promise<StaffOrganisationRole[]> {
    const response = await staffApiClient.get<StaffOrganisationRole[]>(
      `/organisation/${orgId}/roles/`
    );
    return response.data;
  }
}

export const organisationService = new OrganisationService();
export default organisationService;
