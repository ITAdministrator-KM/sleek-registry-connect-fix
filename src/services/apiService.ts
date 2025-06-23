const API_BASE_URL = 'https://dskalmunai.lk/backend/api';

export interface PublicUser {
  id: number;
  public_id: string;
  public_user_id: string;
  name: string;
  nic: string;
  email: string;
  mobile: string;
  address: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  qr_code_data?: string;
  qr_code_url?: string;
  qr_code?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  user_id: string;
  name: string;
  nic?: string;
  email: string;
  username: string;
  role: 'admin' | 'staff' | 'public';
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: number;
  name: string;
  department_id: number;
  department_name?: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCatalog {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  department_id: number;
  division_id?: number;
  icon: string;
  fee_amount: number;
  required_documents: string[];
  processing_time_days: number;
  eligibility_criteria?: string;
  form_template_url?: string;
  status: string;
  department_name?: string;
  division_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenInfo {
  id?: number;
  token_number: string;
  estimated_wait_time: number;
  queue_position: number;
  status: string;
  service_name: string;
  is_next: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
    id: number;
    recipient_id: number;
    recipient_type: string;
    message: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface RegistryEntry {
  id: number;
  registry_id: string;
  public_user_id?: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_address?: string;
  visitor_phone?: string;
  department_id: number;
  division_id?: number;
  purpose_of_visit: string;
  remarks?: string;
  entry_time: string;
  visitor_type: 'new' | 'existing';
  status: 'active' | 'checked_out' | 'deleted';
  department_name?: string;
  division_name?: string;
  public_user_name?: string;
  public_user_id_ref?: string;
  updated_at?: string;
}

class ApiService {
  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}, 
    retries = 3, 
    backoff = 1000
  ): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const authToken = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
      credentials: 'include' as const,
    };

    console.log(`API Request [${config.method || 'GET'}] to: ${url}`);
    console.log('Auth token exists:', !!authToken);
    console.log('Request config:', { 
      method: config.method, 
      headers: config.headers, 
      hasBody: !!config.body,
      url 
    });

    try {
      console.log(`Making API request to: ${url}`, { method: options.method || 'GET' });
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      // Clone the response for error handling
      const responseClone = response.clone();
      
      console.log(`Response [${response.status}] from: ${url}`);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorText = '';
        let errorData: any = null;
        
        try {
          errorText = await response.text();
          // Try to parse as JSON if possible
          errorData = errorText ? JSON.parse(errorText) : null;
        } catch (parseError) {
          console.warn('Error parsing error response as JSON:', parseError);
          errorData = { message: errorText || 'Unknown error occurred' };
        }
        
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url,
          endpoint,
          error: errorData || errorText,
        };
        
        console.error(`API request failed with status ${response.status}:`, errorDetails);
        
        // Create a proper error object with status
        const error = new Error(errorData?.message || `HTTP error! status: ${response.status}`) as Error & {
          status?: number;
          statusText?: string;
          url?: string;
          response?: any;
        };
        
        error.status = response.status;
        error.statusText = response.statusText;
        error.url = url;
        error.response = errorData;
        
        // Don't retry 500 errors, just throw
        if (response.status >= 500) {
          throw error;
        }
        
        // For other errors, retry if we have retries left
        if (retries > 0) {
          console.log(`Retrying request (${retries} attempts remaining)...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          return this.makeRequest(endpoint, options, retries - 1, backoff * 2);
        }
        
        throw error;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.log(`API request successful (non-JSON): ${url}`);
        return textResponse;
      }
      
      try {
        const data = await response.json();
        console.log(`API request successful: ${url}`);
        return data;
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        // Return empty object instead of throwing to prevent UI crashes
        return {};
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const errorMsg = `Request timed out after 15s: ${url}`;
        console.error(errorMsg);
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      
      // Network errors - retry if we have retries left
      if (error instanceof TypeError && error.message === 'Failed to fetch' && retries > 0) {
        console.log(`Network error, retrying request (${retries} attempts remaining)...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.makeRequest(endpoint, options, retries - 1, backoff * 2);
      }
      
      const errorDetails = {
        error: error instanceof Error ? error.message : 'Unknown error',
        url,
        endpoint,
        stack: error instanceof Error ? error.stack : undefined,
      };
      
      console.error('API request failed:', errorDetails);
      throw error;
    }
  }

  private async makeRequestWithRetry(endpoint: string, options: RequestInit = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);
        return await this.makeRequest(endpoint, options);
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries && error.message?.includes('500')) {
          console.log(`Retrying request (${maxRetries - attempt} attempts remaining)...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        console.error('API request failed:', {
          error: error.message,
          url: `${API_BASE_URL}${endpoint}`,
          endpoint,
          stack: error.stack
        });
        break;
      }
    }
    
    throw lastError;
  }

  // Tokens
  async getActiveToken(): Promise<TokenInfo | null> {
    try {
      return await this.makeRequestWithRetry('/tokens/active');
    } catch (error) {
      console.warn('Failed to fetch active token:', error);
      return null;
    }
  }

  // Notifications
  async getNotifications(recipientId: number, recipientType: 'public' | 'staff' | 'admin' = 'staff'): Promise<Notification[]> {
    try {
      console.log(`Fetching notifications for ${recipientType} ID: ${recipientId}`);
      const endpoint = `/notifications/index.php?recipient_id=${recipientId}&recipient_type=${recipientType}`;
      const response = await this.makeRequest(endpoint);
      
      if (!Array.isArray(response)) {
        console.warn('Unexpected notifications response format:', response);
        return [];
      }
      
      console.log(`Successfully fetched ${response.length} notifications`);
      return response;
    } catch (error) {
      console.error('Failed to fetch notifications:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipientId,
        recipientType,
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Return empty array on error to prevent UI from breaking
      return [];
    }
  }

  // Service Catalog - Enhanced with better error handling
  async getServices(): Promise<ServiceCatalog[]> {
    try {
      const response = await this.makeRequestWithRetry('/service-catalog/');
      console.log('Services API response:', response);
      
      // Handle different response formats
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else if (response?.services && Array.isArray(response.services)) {
        return response.services;
      }
      
      console.warn('Unexpected services response format:', response);
      return [];
    } catch (error: any) {
      console.error('Failed to fetch services:', {
        error: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack
      });

      // Check if it's a server error (500)
      if (error.status === 500) {
        console.warn('Server error encountered, attempting to use cached data if available');
        // In the future, we could implement a caching mechanism here
        
        // For now, return empty array but trigger a notification
        if (typeof window !== 'undefined') {
          // Only show toast if we're in browser environment
          const toast = (window as any).toast;
          if (toast?.error) {
            toast.error('Service catalog temporarily unavailable. Please try again later.');
          }
        }
      }
      
      return [];
    }
  }

  async getPublicServices(): Promise<ServiceCatalog[]> {
    try {
      const response = await this.makeRequestWithRetry('/service-catalog/?public=true');
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch public services:', error);
      return [];
    }
  }

  async createService(serviceData: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    try {
      const response = await this.makeRequestWithRetry('/service-catalog/', {
        method: 'POST',
        body: JSON.stringify(serviceData),
      });
      return response?.data || response;
    } catch (error) {
      console.error('Failed to create service:', error);
      throw error;
    }
  }

  async updateService(id: number, serviceData: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    try {
      const response = await this.makeRequestWithRetry(`/service-catalog/?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(serviceData),
      });
      return response?.data || response;
    } catch (error) {
      console.error('Failed to update service:', error);
      throw error;
    }
  }

  async deleteService(id: number): Promise<void> {
    try {
      await this.makeRequestWithRetry(`/service-catalog/?id=${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete service:', error);
      throw error;
    }
  }

  // Public Users
  async getPublicUsers(): Promise<PublicUser[]> {
    try {
      const response = await this.makeRequestWithRetry('/public-users/');
      console.log('Public users API response:', response);
      
      // Handle different response formats
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else if (response?.users && Array.isArray(response.users)) {
        return response.users;
      }
      
      console.warn('Unexpected public users response format:', response);
      return [];
    } catch (error) {
      console.error('Failed to fetch public users:', error);
      return [];
    }
  }

  async createPublicUser(userData: any): Promise<PublicUser> {
    const response = await this.makeRequestWithRetry('/public-users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response?.data || response;
  }

  async updatePublicUser(id: number, userData: any): Promise<PublicUser> {
    const response = await this.makeRequestWithRetry('/public-users/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response?.data || response;
  }

  async deletePublicUser(id: number): Promise<void> {
    await this.makeRequestWithRetry('/public-users/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Users - Fixed to properly handle API responses
  async getUsers(status?: string): Promise<User[]> {
    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const response = await this.makeRequestWithRetry(`/users${query}`);
      console.log('Users API response:', response);
      
      // Handle the response format from the backend
      if (response && response.status === 'success' && Array.isArray(response.data)) {
        // Transform the data to match the User interface
        return response.data.map((user: any) => ({
          id: user.id,
          user_id: user.user_id || `USR-${user.id}`,
          name: user.name,
          nic: user.nic || '',
          email: user.email,
          username: user.username,
          role: user.role,
          department_id: user.department_id || null,
          division_id: user.division_id || null,
          department_name: user.department_name || '',
          division_name: user.division_name || '',
          status: user.status || 'active',
          created_at: user.created_at,
          updated_at: user.updated_at
        }));
      }
      
      console.warn('Unexpected users response format:', response);
      return [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  async createUser(userData: any): Promise<User> {
    try {
      const response = await this.makeRequestWithRetry('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      // Handle the response format from the backend
      if (response && response.status === 'success' && response.data) {
        const user = response.data;
        return {
          id: user.id,
          user_id: user.user_id || `USR-${user.id}`,
          name: user.name,
          nic: user.nic || '',
          email: user.email,
          username: user.username,
          role: user.role,
          department_id: user.department_id || null,
          division_id: user.division_id || null,
          department_name: user.department_name || '',
          division_name: user.division_name || '',
          status: user.status || 'active',
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      }
      
      throw new Error('Unexpected response format from server');
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: any): Promise<User> {
    try {
      const response = await this.makeRequestWithRetry(`/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      // Handle the response format from the backend
      if (response && response.status === 'success' && response.data) {
        const user = response.data;
        return {
          id: user.id,
          user_id: user.user_id || `USR-${user.id}`,
          name: user.name,
          nic: user.nic || '',
          email: user.email,
          username: user.username,
          role: user.role,
          department_id: user.department_id || null,
          division_id: user.division_id || null,
          department_name: user.department_name || '',
          division_name: user.division_name || '',
          status: user.status || 'active',
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      }
      
      throw new Error('Unexpected response format from server');
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      const response = await this.makeRequestWithRetry(`/users/${id}`, {
        method: 'DELETE',
      });
      
      // Handle the response format from the backend
      if (!response || response.status !== 'success') {
        throw new Error(response?.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.makeRequestWithRetry('/departments/');
      console.log('API request successful:', `${API_BASE_URL}/departments/`);
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      return [];
    }
  }

  // Divisions - Enhanced to filter by department
  async getDivisions(departmentId?: number): Promise<Division[]> {
    try {
      const query = departmentId ? `?department_id=${departmentId}` : '';
      const response = await this.makeRequestWithRetry(`/divisions/${query}`);
      console.log('API request successful:', `${API_BASE_URL}/divisions/${query}`);
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch divisions:', error);
      return [];
    }
  }

  // Document Upload
  async uploadDocument(file: File, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  }

  // Registry Management
  async getRegistryEntries(date?: string): Promise<RegistryEntry[]> {
    try {
      const query = date ? `?date=${date}` : '';
      const response = await this.makeRequestWithRetry(`/registry/${query}`);
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch registry entries:', error);
      return [];
    }
  }

  async createRegistryEntry(entryData: any): Promise<RegistryEntry> {
    const response = await this.makeRequestWithRetry('/registry/', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return response?.data || response;
  }

  async updateRegistryEntry(id: number, entryData: any): Promise<RegistryEntry> {
    const response = await this.makeRequestWithRetry('/registry/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...entryData }),
    });
    return response?.data || response;
  }

  async deleteRegistryEntry(id: number): Promise<void> {
    await this.makeRequestWithRetry('/registry/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  async getPublicUserById(publicId: string): Promise<PublicUser | null> {
    try {
      const users = await this.getPublicUsers();
      return users.find(user => user.public_user_id === publicId || user.public_id === publicId) || null;
    } catch (error) {
      console.error('Failed to fetch public user by ID:', error);
      return null;
    }
  }

  // Token Management
  async getTokens(): Promise<any[]> {
    try {
      const response = await this.makeRequestWithRetry('/tokens/');
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      return [];
    }
  }

  async createToken(tokenData: any): Promise<any> {
    const response = await this.makeRequestWithRetry('/tokens/', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
    return response?.data || response;
  }

  async updateToken(id: number, tokenData: any): Promise<any> {
    const response = await this.makeRequestWithRetry('/tokens/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...tokenData }),
    });
    return response?.data || response;
  }
}

export const apiService = new ApiService();
