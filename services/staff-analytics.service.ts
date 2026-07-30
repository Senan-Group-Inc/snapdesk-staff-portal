import staffApiClient from '@/lib/staff-api-client';
import {
  PlatformOverview,
  OrganisationAnalytics,
  TicketAnalytics,
  UserAnalytics,
  PlatformGrowth,
} from '@/types';

/**
 * Staff Analytics Service
 * 
 * Handles all analytics-related API endpoints for staff members.
 * All endpoints require staff authentication and the `view_platform_analytics` permission.
 */
class StaffAnalyticsService {
  private basePath = '/analytics';

  /**
   * Get platform-wide overview statistics
   * GET /api/v1/staff/analytics/overview
   */
  async getPlatformOverview(): Promise<PlatformOverview> {
    const response = await staffApiClient.get<PlatformOverview>(
      `${this.basePath}/overview`
    );
    return response.data;
  }

  /**
   * Get organisation analytics
   * GET /api/v1/staff/analytics/organisations
   */
  async getOrganisationAnalytics(params?: {
    start_date?: string; // ISO format: YYYY-MM-DD
    end_date?: string; // ISO format: YYYY-MM-DD
  }): Promise<OrganisationAnalytics> {
    const response = await staffApiClient.get<OrganisationAnalytics>(
      `${this.basePath}/organisations`,
      { params }
    );
    return response.data;
  }

  /**
   * Get ticket analytics
   * GET /api/v1/staff/analytics/tickets
   */
  async getTicketAnalytics(params?: {
    start_date?: string; // ISO format: YYYY-MM-DD
    end_date?: string; // ISO format: YYYY-MM-DD
  }): Promise<TicketAnalytics> {
    const response = await staffApiClient.get<TicketAnalytics>(
      `${this.basePath}/tickets`,
      { params }
    );
    return response.data;
  }

  /**
   * Get user analytics
   * GET /api/v1/staff/analytics/users
   */
  async getUserAnalytics(params?: {
    start_date?: string; // ISO format: YYYY-MM-DD
    end_date?: string; // ISO format: YYYY-MM-DD
  }): Promise<UserAnalytics> {
    const response = await staffApiClient.get<UserAnalytics>(
      `${this.basePath}/users`,
      { params }
    );
    return response.data;
  }

  /**
   * Get platform growth metrics
   * GET /api/v1/staff/analytics/growth
   */
  async getPlatformGrowth(params?: {
    days?: number; // Number of days to include (default: 90)
  }): Promise<PlatformGrowth> {
    const response = await staffApiClient.get<PlatformGrowth>(
      `${this.basePath}/growth`,
      { params }
    );
    return response.data;
  }
}

export const staffAnalyticsService = new StaffAnalyticsService();
export default staffAnalyticsService;

