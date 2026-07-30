import axios, { AxiosError } from 'axios';

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      detail?: string;
      message?: string;
      errors?: Record<string, string[]>;
    }>;

    // Handle response errors
    if (axiosError.response) {
      const { data, status } = axiosError.response;

      // Field-specific validation errors
      if (data?.errors && typeof data.errors === 'object') {
        const errorMessages = Object.entries(data.errors)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return `${field}: ${messages}`;
          })
          .join('\n');
        return errorMessages || 'Validation error';
      }

      // General error message
      if (data?.detail) {
        return data.detail;
      }

      if (data?.message) {
        return data.message;
      }

      // HTTP status code messages
      switch (status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Unauthorized. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 422:
          return 'Validation error. Please check your input.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `Error ${status}: ${axiosError.message}`;
      }
    }

    // Network errors
    if (axiosError.request) {
      return 'Network error. Please check your connection.';
    }
  }

  // Unknown error
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

