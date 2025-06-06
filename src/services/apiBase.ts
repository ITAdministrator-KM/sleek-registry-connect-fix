
export class ApiBase {
  // Point to live server
  private baseURL = 'https://dskalmunai.lk/backend/api';

  protected async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from localStorage - check both 'authToken' and 'token' for backward compatibility
    let authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    // Log the token status for debugging
    console.log(`API Request [${options.method || 'GET'}] to: ${url}`);
    console.log('Auth token exists:', !!authToken);
    
    // Create headers object
    const headers = new Headers();
    
    // Set default headers
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    
    // Add auth token if it exists
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    
    // Create the request options
    const defaultOptions: RequestInit = {
      method: 'GET',
      credentials: 'include', // Important for cookies/sessions
      headers,
      ...options,
    };
    
    // Handle request body
    if (defaultOptions.body) {
      if (typeof defaultOptions.body === 'object' && !(defaultOptions.body instanceof FormData)) {
        defaultOptions.body = JSON.stringify(defaultOptions.body);
      }
      // If it's FormData, let the browser set the Content-Type header automatically
      else if (defaultOptions.body instanceof FormData) {
        // Remove the Content-Type header to let the browser set it with the correct boundary
        headers.delete('Content-Type');
      }
    }
    
    // Merge any headers that were passed in the options
    if (options.headers) {
      const incomingHeaders = new Headers(options.headers);
      incomingHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }
    
    // Update the headers in the request options
    defaultOptions.headers = headers;

    // Log request details
    console.log('Request config:', {
      method: defaultOptions.method,
      headers: Object.fromEntries(headers.entries()),
      hasBody: !!defaultOptions.body,
      url
    });

    try {
      const response = await fetch(url, defaultOptions);
      
      console.log(`Response [${response.status} ${response.statusText}] from: ${url}`);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      
      // Try to parse as JSON, fallback to text
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.warn('Failed to parse JSON response, using raw text');
        responseData = responseText;
      }

      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          response: responseData
        });
        
        // Handle specific error cases
        if (response.status === 401) {
          console.warn('Authentication failed, clearing auth data');
          // Clear all auth-related data
          ['authToken', 'token', 'userRole', 'username', 'userData', 'userId', 'userFullName'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        // Create a more descriptive error message
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (responseData) {
          if (typeof responseData === 'string') {
            errorMessage = responseData;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData.error) {
            errorMessage = responseData.error;
          } else {
            errorMessage = JSON.stringify(responseData);
          }
        }
        
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).response = responseData;
        throw error;
      }
      
      return responseData;
    } catch (error) {
      console.log('API request failed:', error);
      throw error;
    }
  }
}
