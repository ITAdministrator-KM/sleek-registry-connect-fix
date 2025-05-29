
export class ApiBase {
  private baseURL = 'https://dskalmunai.lk/backend/api';

  protected async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    
    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      ...options,
    };

    // Merge headers properly
    if (options.headers) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        ...options.headers,
      };
    }

    console.log('Making request to:', url);
    console.log('Request config:', defaultOptions);

    try {
      const response = await fetch(url, defaultOptions);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      
      // Try to parse as JSON, fallback to text
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        console.log('Error response:', responseData);
        
        // Handle specific error cases
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
        
        const errorMessage = responseData?.message || responseData?.details || `HTTP ${response.status}`;
        throw new Error(`HTTP ${response.status}: ${typeof responseData === 'object' ? JSON.stringify(responseData) : responseData}`);
      }

      return responseData;
    } catch (error) {
      console.log('API request failed:', error);
      throw error;
    }
  }
}
