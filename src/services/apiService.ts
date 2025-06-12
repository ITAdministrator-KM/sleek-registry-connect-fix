import { ApiBase } from './apiBase';

export type UserRole = 'admin' | 'staff' | 'public';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  meta?: any;
}

export interface User {
  id: number;
  user_id: string;
  name: string;
  nic: string;
  email: string;
  username: string;
  role: UserRole;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: string;
  created_at: string;
}

export interface Department {
  id: number;
  dept_id?: string;
  name: string;
  description: string;
  division_count?: number;
  status: string;
  created_at: string;
}

export interface Division {
  id: number;
  div_id?: string;
  name: string;
  department_id: number;
  department_name?: string;
  description: string;
  status: string;
  created_at: string;
}

export interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email: string;
  username: string;
  password?: string;
  qr_code?: string;
  qr_code_data?: string;
  qr_code_url?: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

class ApiService extends ApiBase {
  private maxRetries = 3;
  private retryDelay = 1000;

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.isRetriableError(error)) {
        console.log(`Retrying request, ${retries} attempts remaining...`);
        await this.delay(this.retryDelay);
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  private isRetriableError(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.code === 'NETWORK_ERROR'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleApiError(error: any, operation: string): Error {
    console.error(`${operation} failed:`, error);
    
    // Parse error response for user-friendly messages
    let message = `Failed to ${operation.toLowerCase()}. Please try again.`;
    
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.message) {
        message = errorData.message;
      } else if (errorData.details) {
        message = `${operation} failed: ${errorData.details}`;
      }
    } else if (error.message) {
      message = error.message.includes('500') 
        ? `Server error while ${operation.toLowerCase()}. Please contact support if this persists.`
        : error.message;
    }
    
    return new Error(message);
  }

  // Users API
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.retryRequest(() =>
        this.makeRequest('/users/index.php')
      );
      // Handle both direct array response and data property
      if (Array.isArray(response)) {
        return response;
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw this.handleApiError(error, 'fetch users');
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const response = await this.makeRequest('/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'create user');
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await this.makeRequest('/users/', {
        method: 'PUT',
        body: JSON.stringify({ id, ...userData }),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'update user');
    }
  }

  async deleteUser(id: number): Promise<any> {
    try {
      const response = await this.makeRequest('/users/', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'delete user');
    }
  }

  // Departments API
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.retryRequest(() =>
        this.makeRequest('/departments/')
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw this.handleApiError(error, 'fetch departments');
    }
  }

  async createDepartment(departmentData: { name: string; description: string }): Promise<Department> {
    try {
      const response = await this.makeRequest('/departments/', {
        method: 'POST',
        body: JSON.stringify(departmentData),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'create department');
    }
  }

  async updateDepartment(data: { id: number; name: string; description: string }): Promise<Department> {
    try {
      const response = await this.makeRequest('/departments/', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'update department');
    }
  }

  async deleteDepartment(id: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.makeRequest(`/departments/?id=${id}`, {
          method: 'DELETE'
        })
      );
    } catch (error) {
      console.error('Error deleting department:', error);
      throw this.handleApiError(error, 'delete department');
    }
  }

  // Divisions API
  async getDivisions(departmentId?: number): Promise<Division[]> {
    try {
      const endpoint = departmentId ? `/divisions/?department_id=${departmentId}` : '/divisions/';
      const response = await this.retryRequest(() =>
        this.makeRequest(endpoint)
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw this.handleApiError(error, 'fetch divisions');
    }
  }

  async createDivision(divisionData: { name: string; department_id: number; description: string }): Promise<Division> {
    try {
      const response = await this.makeRequest('/divisions/', {
        method: 'POST',
        body: JSON.stringify(divisionData),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'create division');
    }
  }

  async updateDivision(data: { id: number; name: string; department_id: number; description: string }): Promise<Division> {
    try {
      const response = await this.makeRequest('/divisions/', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'update division');
    }
  }

  async deleteDivision(id: number): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.makeRequest(`/divisions/?id=${id}`, {
          method: 'DELETE'
        })
      );
    } catch (error) {
      console.error('Error deleting division:', error);
      throw this.handleApiError(error, 'delete division');
    }
  }

  // Public Users API
  async getPublicUsers(): Promise<PublicUser[]> {
    try {
      const response = await this.retryRequest(() =>
        this.makeRequest('/public-users/')
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw this.handleApiError(error, 'fetch public users');
    }
  }

  async getPublicUserById(id: number): Promise<PublicUser> {
    try {
      const response = await this.makeRequest(`/public-users/?id=${id}`);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'fetch public user');
    }
  }

  async createPublicUser(userData: Partial<PublicUser>): Promise<PublicUser> {
    try {
      const response = await this.makeRequest('/public-users/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'create public user');
    }
  }

  async updatePublicUser(id: number, userData: Partial<PublicUser>): Promise<PublicUser> {
    try {
      const response = await this.makeRequest('/public-users/', {
        method: 'PUT',
        body: JSON.stringify({ id, ...userData }),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'update public user');
    }
  }

  async deletePublicUser(id: number): Promise<any> {
    try {
      const response = await this.makeRequest('/public-users/', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'delete public user');
    }
  }

  // Service History API
  async getServiceHistory(publicUserId: number): Promise<any[]> {
    try {
      const response = await this.retryRequest(() =>
        this.makeRequest(`/service-history/?public_user_id=${publicUserId}`)
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw this.handleApiError(error, 'fetch service history');
    }
  }

  async addServiceHistory(data: {
    public_user_id: number;
    service_name: string;
    department_id: number;
    division_id: number;
    details?: string;
  }): Promise<any> {
    try {
      const response = await this.makeRequest('/service-history/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'add service history');
    }
  }

  async updateServiceHistory(id: number, data: { status?: string; details?: string }): Promise<any> {
    try {
      const response = await this.makeRequest('/service-history/', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'update service history');
    }
  }

  // Token API
  async getTokens(): Promise<any[]> {
    try {
      const response = await this.retryRequest(() =>
        this.makeRequest('/tokens/')
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw this.handleApiError(error, 'fetch tokens');
    }
  }

  async createToken(tokenData: {
    department_id: number;
    division_id: number;
    purpose?: string;
  }): Promise<any> {
    try {
      const response = await this.makeRequest('/tokens/', {
        method: 'POST',
        body: JSON.stringify(tokenData),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'create token');
    }
  }

  async updateTokenStatus(id: number, status: string): Promise<any> {
    try {
      const response = await this.makeRequest('/tokens/', {
        method: 'PUT',
        body: JSON.stringify({ id, status }),
      });
      return response.data || response;
    } catch (error) {
      throw this.handleApiError(error, 'update token status');
    }
  }
}

export const apiService = new ApiService();
