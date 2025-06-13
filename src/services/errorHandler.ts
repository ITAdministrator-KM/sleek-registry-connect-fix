
export class ApiErrorHandler {
  static handleAuthError(error: any) {
    if (error.message?.includes('401') || error.message?.includes('authentication')) {
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
    // Handle different response formats
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
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

  static safeApiCall<T>(apiCall: () => Promise<T>, fallback: T): Promise<T> {
    return apiCall().catch((error) => {
      console.error('API call failed:', error);
      this.handleAuthError(error);
      return fallback;
    });
  }
}
