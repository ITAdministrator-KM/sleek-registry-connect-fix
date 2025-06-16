
const API_BASE_URL = 'https://dskalmunai.lk/backend/api';

export interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  email: string;
  mobile: string;
  address: string;
  date_of_birth?: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  qr_code_data?: string;
  qr_code_url?: string;
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

class ApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const authToken = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      ...options,
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
      const response = await fetch(url, config);
      
      console.log(`Response [${response.status}] from: ${url}`);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          url,
          endpoint,
          response: errorText,
        });
        
        if (response.status === 401) {
          console.warn('Authentication failed, clearing auth data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userData');
          window.location.href = '/login';
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('API responses:', data);
        return data;
      }
      
      return await response.text();
    } catch (error) {
      console.error(`API request failed:`, error);
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

  async getTokens(): Promise<TokenInfo[]> {
    try {
      const response = await this.makeRequestWithRetry('/tokens/');
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.warn('Failed to fetch tokens:', error);
      return [];
    }
  }

  // Notifications
  async getNotifications(recipientId: number, recipientType?: 'public' | 'staff' | 'admin'): Promise<any[]> {
    try {
      let endpoint = `/notifications/index.php?recipient_id=${recipientId}`;
      if (recipientType) {
        endpoint += `&recipient_type=${recipientType}`;
      }
      const response = await this.makeRequestWithRetry(endpoint);
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.warn('Failed to fetch notifications:', error);
      return [];
    }
  }

  // Service Catalog - Enhanced with better error handling
  async getServices(): Promise<ServiceCatalog[]> {
    try {
      const response = await this.makeRequestWithRetry('/service-catalog/');
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch services:', error);
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
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
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

  // Users
  async getUsers(status?: string): Promise<User[]> {
    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const response = await this.makeRequestWithRetry(`/users/${query}`);
      return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  async createUser(userData: any): Promise<User> {
    const response = await this.makeRequestWithRetry('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response?.data || response;
  }

  async updateUser(id: number, userData: any): Promise<User> {
    const response = await this.makeRequestWithRetry('/users/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response?.data || response;
  }

  async deleteUser(id: number): Promise<void> {
    await this.makeRequestWithRetry('/users/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
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
}

export const apiService = new ApiService();
