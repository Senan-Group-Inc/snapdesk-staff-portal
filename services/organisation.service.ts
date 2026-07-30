import staffApiClient from '@/lib/staff-api-client';
import {
  StaffOrganisation,
  CreateStaffOrganisationRequest,
  UpdateStaffOrganisationRequest,
  PaginatedStaffOrganisationsResponse,
} from '@/types';

class OrganisationService {
  /**
   * List all organizations (with optional filters)
   */
  async listOrganisations(params?: {
    name?: string;
    subdomain?: string;
    plan?: 'free' | 'pro' | 'enterprise';
    page?: number;
  }): Promise<PaginatedStaffOrganisationsResponse> {
    const response = await staffApiClient.get<PaginatedStaffOrganisationsResponse>(
      '/organisation/',
      { params }
    );
    return response.data;
  }

  /**
   * Get organization details by ID
   */
  async getOrganisation(id: number): Promise<StaffOrganisation> {
    const response = await staffApiClient.get<StaffOrganisation>(`/organisation/${id}`);
    return response.data;
  }

  /**
   * Get organization details (alternative endpoint)
   */
  async getOrganisationDetails(id: number): Promise<StaffOrganisation> {
    const response = await staffApiClient.get<StaffOrganisation>(
      `/organisation/${id}/details/`
    );
    return response.data;
  }

  /**
   * Create a new organization
   * 
   * Response includes:
   * - id, name, subdomain, email, plan, settings, etc.
   * - owner: ID of owner account (null if no owner)
   * - owner_details: Full owner account details object (null if no owner)
   * - employee_count: Number of employees in the organization
   */
  async createOrganisation(
    data: CreateStaffOrganisationRequest
  ): Promise<StaffOrganisation> {
    const response = await staffApiClient.post<StaffOrganisation>('/organisation/', data);
    // The response.data should contain the organization object directly
    return response.data;
  }

  /**
   * Update organization (partial update)
   */
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

  /**
   * Update organization (full update)
   */
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
}

export const organisationService = new OrganisationService();
export default organisationService;
