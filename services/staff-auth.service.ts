import staffApiClient from '@/lib/staff-api-client';
import axios from 'axios';
import {
  StaffSendVerificationCodeRequest,
  StaffLoginRequest,
  StaffUserResponse,
} from '@/types';

// Staff auth endpoints use /staff prefix
const getStaffAuthBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000/api/v1';
  return `${baseUrl}/staff`;
};

const STAFF_AUTH_API_BASE_URL = getStaffAuthBaseUrl();

class StaffAuthService {
  /**
   * Send verification code (6-digit) to staff email
   */
  async sendVerificationCode(
    data: StaffSendVerificationCodeRequest
  ): Promise<{ success: boolean; message: string }> {
    const response = await axios.post<{ success: boolean; message: string }>(
      `${STAFF_AUTH_API_BASE_URL}/auth/account/send_verification_code`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Staff login with email and 6-digit code
   * Tokens are returned in response headers: set-auth-token and set-refresh-token
   */
  async login(data: StaffLoginRequest): Promise<StaffUserResponse> {
    // Use axios directly to access response headers
    const response = await axios.post(
      `${STAFF_AUTH_API_BASE_URL}/auth/account/login`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    // Extract tokens from headers
    const authToken = response.headers['set-auth-token'];
    const refreshToken = response.headers['set-refresh-token'];

    if (authToken && typeof window !== 'undefined') {
      localStorage.setItem('staff_access_token', authToken);
    }
    if (refreshToken && typeof window !== 'undefined') {
      localStorage.setItem('staff_refresh_token', refreshToken);
    }

    return response.data;
  }

  /**
   * Logout - clear staff tokens from storage
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('staff_access_token');
      localStorage.removeItem('staff_refresh_token');
    }
  }

  /**
   * Get staff access token from storage
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('staff_access_token');
    }
    return null;
  }

  /**
   * Get staff refresh token from storage
   */
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('staff_refresh_token');
    }
    return null;
  }

  /**
   * Check if staff user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Get current staff user with permissions
   * This endpoint returns the current authenticated staff user with their permissions
   */
  async getCurrentUser(): Promise<StaffUserResponse> {
    const response = await staffApiClient.get<StaffUserResponse>('/auth/account/me');
    return response.data;
  }
}

export const staffAuthService = new StaffAuthService();
export default staffAuthService;

