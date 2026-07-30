import staffApiClient from '@/lib/staff-api-client';
import {
  PlatformSettings,
  FeatureFlags,
  UpdatePlatformSettingsRequest,
  ToggleFeatureRequest,
  ToggleFeatureResponse,
  UpdateSettingsResponse,
} from '@/types';

/**
 * Platform Settings Service
 * 
 * Handles all platform settings-related API endpoints for staff members.
 * All endpoints require staff authentication and appropriate permissions.
 */
class StaffSettingsService {
  private basePath = '/settings';

  /**
   * Get current platform settings
   * GET /api/v1/staff/settings/current
   */
  async getCurrentSettings(): Promise<PlatformSettings> {
    const response = await staffApiClient.get<PlatformSettings>(
      `${this.basePath}/current`
    );
    return response.data;
  }

  /**
   * Update platform settings (partial update)
   * PATCH /api/v1/staff/settings/update_settings
   */
  async updateSettings(data: UpdatePlatformSettingsRequest): Promise<UpdateSettingsResponse> {
    const response = await staffApiClient.patch<UpdateSettingsResponse>(
      `${this.basePath}/update_settings`,
      data
    );
    return response.data;
  }

  /**
   * Update platform settings (full update)
   * PUT /api/v1/staff/settings/update_settings
   */
  async updateSettingsFull(data: UpdatePlatformSettingsRequest): Promise<UpdateSettingsResponse> {
    const response = await staffApiClient.put<UpdateSettingsResponse>(
      `${this.basePath}/update_settings`,
      data
    );
    return response.data;
  }

  /**
   * Get all feature flags
   * GET /api/v1/staff/settings/feature_flags
   */
  async getFeatureFlags(): Promise<FeatureFlags> {
    const response = await staffApiClient.get<FeatureFlags>(
      `${this.basePath}/feature_flags`
    );
    return response.data;
  }

  /**
   * Toggle a feature flag
   * POST /api/v1/staff/settings/toggle_feature
   */
  async toggleFeature(data: ToggleFeatureRequest): Promise<ToggleFeatureResponse> {
    const response = await staffApiClient.post<ToggleFeatureResponse>(
      `${this.basePath}/toggle_feature`,
      data
    );
    return response.data;
  }
}

export const staffSettingsService = new StaffSettingsService();
export default staffSettingsService;

