
export class ApiBase {
  protected baseURL: string;

  constructor() {
    this.baseURL = 'https://dskalmunai.lk/backend/api';
  }

  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  protected async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    console.log(`Making API request to: ${url}`, config);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Response from ${url}:`, data);
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  protected async makeRequestWithRetry(endpoint: string, options: RequestInit = {}, retries: number = 1): Promise<any> {
    try {
      return await this.makeRequest(endpoint, options);
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying request (${retries} attempts remaining)...`);
        return this.makeRequestWithRetry(endpoint, options, retries - 1);
      }
      throw error;
    }
  }
}
