
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

class ApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed:`, error);
      throw error;
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
