
import { ApiBase } from './apiBase';

export interface User {
  id: number;
  user_id?: string;
  name: string;
  nic: string;
  email: string;
  username: string;
  password?: string;
  role: 'admin' | 'staff' | 'public' | 'subject_staff';
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at?: string;
  updated_at?: string;
}

export interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  email?: string;
  username?: string;
  mobile: string;
  address: string;
  date_of_birth?: string;
  department_id?: number;
  division_id?: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Division {
  id: number;
  name: string;
  code?: string;
  department_id: number;
  description?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface ServiceCatalog {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  department_id: number;
  department_name?: string;
  division_id?: number;
  division_name?: string;
  fee_amount: number;
  processing_time_days: number;
  required_documents?: string; // Keep as string for API consistency
  status: 'active' | 'inactive';
  icon?: string;
  eligibility_criteria?: string; // Add missing property
  form_template_url?: string; // Add missing property
  created_at?: string;
  updated_at?: string;
}

class ApiService extends ApiBase {
  // User Management
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.makeRequest('/users/index.php');
      console.log('Users API response:', response);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response?.users && Array.isArray(response.users)) {
        return response.users;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const response = await this.makeRequest('/users/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response?.data || response;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await this.makeRequest('/users/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, id })
    });
    return response?.data || response;
  }

  async deleteUser(id: number): Promise<boolean> {
    await this.makeRequest(`/users/index.php?id=${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  // Public User Management
  async getPublicUsers(): Promise<PublicUser[]> {
    try {
      const response = await this.makeRequest('/public-users/index.php');
      console.log('Public Users API response:', response);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching public users:', error);
      return [];
    }
  }

  async createPublicUser(userData: Omit<PublicUser, 'id' | 'public_id' | 'created_at' | 'updated_at'> & { status: 'active' | 'inactive' }): Promise<PublicUser> {
    const response = await this.makeRequest('/public-users/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response?.data || response;
  }

  async updatePublicUser(id: number, userData: Partial<PublicUser>): Promise<PublicUser> {
    const response = await this.makeRequest('/public-users/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, id })
    });
    return response?.data || response;
  }

  async deletePublicUser(id: number): Promise<boolean> {
    await this.makeRequest('/public-users/index.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return true;
  }

  // Department Management
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.makeRequest('/departments/index.php');
      console.log('Departments API response:', response);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async createDepartment(departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const response = await this.makeRequest('/departments/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(departmentData)
    });
    return response?.data || response;
  }

  async updateDepartment(id: number, departmentData: Partial<Department>): Promise<Department> {
    const response = await this.makeRequest('/departments/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...departmentData, id })
    });
    return response?.data || response;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    await this.makeRequest(`/departments/index.php?id=${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  // Division Management
  async getDivisions(departmentId?: number): Promise<Division[]> {
    try {
      const url = departmentId 
        ? `/divisions/index.php?department_id=${departmentId}`
        : '/divisions/index.php';
      
      const response = await this.makeRequest(url);
      console.log('Divisions API response:', response);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching divisions:', error);
      return [];
    }
  }

  async createDivision(divisionData: Omit<Division, 'id' | 'created_at' | 'updated_at'>): Promise<Division> {
    const response = await this.makeRequest('/divisions/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(divisionData)
    });
    return response?.data || response;
  }

  async updateDivision(id: number, divisionData: Partial<Division>): Promise<Division> {
    const response = await this.makeRequest('/divisions/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...divisionData, id })
    });
    return response?.data || response;
  }

  async deleteDivision(id: number): Promise<boolean> {
    await this.makeRequest(`/divisions/index.php?id=${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  // Service Catalog Management
  async getServices(): Promise<ServiceCatalog[]> {
    try {
      const response = await this.makeRequest('/service-catalog/index.php');
      console.log('Services API response:', response);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async getPublicServices(): Promise<ServiceCatalog[]> {
    try {
      const response = await this.makeRequest('/service-catalog/index.php?public=true');
      console.log('Public Services API response:', response);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching public services:', error);
      return [];
    }
  }

  async createService(serviceData: Omit<ServiceCatalog, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceCatalog> {
    const response = await this.makeRequest('/service-catalog/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    return response?.data || response;
  }

  async updateService(id: number, serviceData: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    const response = await this.makeRequest('/service-catalog/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...serviceData, id })
    });
    return response?.data || response;
  }

  async deleteService(id: number): Promise<boolean> {
    await this.makeRequest(`/service-catalog/index.php?id=${id}`, {
      method: 'DELETE'
    });
    return true;
  }
}

export const apiService = new ApiService();
