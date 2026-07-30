import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000/api/v1';

// Create axios instance for staff endpoints
const staffApiClient = axios.create({
  baseURL: `${API_BASE_URL}/staff`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token to requests
staffApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('staff_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
staffApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't redirect for auth endpoints
      const authEndpoints = [
        '/auth/account/send_verification_code',
        '/auth/account/login',
      ];

      const isAuthEndpoint = authEndpoints.some((endpoint) =>
        originalRequest.url?.includes(endpoint)
      );

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        // Clear tokens and redirect to admin login
        localStorage.removeItem('staff_access_token');
        localStorage.removeItem('staff_refresh_token');
        window.location.href = '/admin/login';
      }
    }

    return Promise.reject(error);
  }
);

export default staffApiClient;

