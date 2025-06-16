
interface ApiError extends Error {
  status?: number;
  statusText?: string;
  url?: string;
  response?: any;
}

export class ApiErrorHandler {
  static handleAuthError(error: ApiError) {
    if (error.status === 401 || error.message?.includes('401') || error.message?.includes('authentication')) {
      console.warn('Authentication failed, redirecting to login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      window.location.href = '/login';
      return true;
    }
    return false;
  }

  static handleApiResponse(response: any, fallback: any[] = []) {
    // If response is an error object, handle it
    if (response instanceof Error) {
      console.warn('API call returned error:', response.message);
      return fallback;
    }
    
    // Handle different response formats
    if (response?.data) {
      return Array.isArray(response.data) ? response.data : [response.data];
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.success === false) {
      console.warn('API returned error:', response.message);
      return fallback;
    }
    // Fallback for non-array responses
    return fallback;
  }

  static safeApiCall<T = any>(apiCall: () => Promise<T>, fallback: T): Promise<T> {
    return apiCall().catch((error: any) => {
      const apiError: ApiError = error;
      
      console.error('API call failed:', {
        message: apiError.message,
        status: apiError.status,
        statusText: apiError.statusText,
        url: apiError.url,
        response: apiError.response
      });
      
      // Don't retry 500 errors, just return fallback
      if (apiError.status === 500) {
        console.error('Server error (500) - not retrying');
        return fallback;
      }
      
      // Handle auth errors
      if (this.handleAuthError(apiError)) {
        return fallback;
      }
      
      return fallback;
    });
  }
}
