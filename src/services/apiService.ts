
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
  nic?: string;  // Make nic optional to match the actual API response
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
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, */*',
        ...options.headers,
      },
      credentials: 'include' as const,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
          url,
          response: errorText,
        });
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      // Check if response has content before trying to parse as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      // For non-JSON responses, return the raw response
      return await response.text();
    } catch (error) {
      console.error(`API request failed:`, error);
      throw error;
    }
  }

  // Tokens
  async getActiveToken(): Promise<TokenInfo | null> {
    try {
      return await this.makeRequest('/tokens/active');
    } catch (error) {
      console.warn('Failed to fetch active token:', error);
      return null;
    }
  }

  // Notifications
  async getNotifications(recipientId: number, recipientType?: 'public' | 'staff' | 'admin'): Promise<Notification[]> {
    try {
      let endpoint = `/notifications?recipient_id=${recipientId}`;
      if (recipientType) {
        endpoint += `&recipient_type=${recipientType}`;
      }
      const response = await this.makeRequest(endpoint);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.warn('Failed to fetch notifications:', error);
      return [];
    }
  }

  // Service Catalog
  async getServices() {
    return this.makeRequest('/service-catalog/');
  }

  async getPublicServices() {
    return this.makeRequest('/service-catalog/?public=true');
  }

  async createService(serviceData: any) {
    return this.makeRequest('/service-catalog/', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: number, serviceData: any) {
    return this.makeRequest(`/service-catalog/?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(id: number) {
    return this.makeRequest(`/service-catalog/?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Public Users
  async getPublicUsers(): Promise<PublicUser[]> {
    const response = await this.makeRequest('/public-users/');
    return response.data || response;
  }

  async createPublicUser(userData: any): Promise<PublicUser> {
    const response = await this.makeRequest('/public-users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data || response;
  }

  async updatePublicUser(id: number, userData: any): Promise<PublicUser> {
    const response = await this.makeRequest('/public-users/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response.data || response;
  }

  async deletePublicUser(id: number) {
    return this.makeRequest('/public-users/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Users
  async getUsers(status?: string): Promise<User[]> {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    const response = await this.makeRequest(`/users/${query}`);
    return response.data || response;
  }

  async createUser(userData: any): Promise<User> {
    const response = await this.makeRequest('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data || response;
  }

  async updateUser(id: number, userData: any): Promise<User> {
    const response = await this.makeRequest('/users/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response.data || response;
  }

  async deleteUser(id: number) {
    return this.makeRequest('/users/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    const response = await this.makeRequest('/departments/');
    return response.data || response;
  }

  // Divisions
  async getDivisions(departmentId?: number): Promise<Division[]> {
    const query = departmentId ? `?department_id=${departmentId}` : '';
    const response = await this.makeRequest(`/divisions/${query}`);
    return response.data || response;
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
