import { authService } from './authService';
import { departmentService } from './departmentService';
import { userService } from './userService';
import { notificationService } from './notificationService';
import { ApiBase } from './apiBase';

// Re-export types
export type { Department } from './departmentService';
export type { User } from './userService';
export type { Notification } from './notificationService';

// Internal interfaces
interface LoginData {
  username: string;
  password: string;
  role: string;
}

interface Token {
  id: number;
  token_number: number;
  department_id: number;
  division_id: number;
  department_name: string;
  division_name: string;
  public_user_name?: string;
  public_id?: string;
  status: 'active' | 'called' | 'completed';
  created_at: string;
}

interface ServiceHistory {
  id: number;
  public_user_id: number;
  department_id: number;
  division_id: number;
  department_name: string;
  division_name: string;
  service_name: string;
  staff_user_id: number;
  status: 'completed' | 'pending' | 'processing';
  created_at: string;
}

interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email: string;
  username: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  qr_code?: string;
  status: string;
  created_at: string;
}

// Export types that are needed by other modules
export interface Division {
  id: number;
  name: string;
  department_id: number;
  department_name: string;
  description?: string;
  status: string;
  created_at: string;
}

export { type LoginData, type Token, type ServiceHistory, type PublicUser };

class ApiService extends ApiBase {
  // Auth methods
  async login(data: LoginData): Promise<any> {
    return authService.login(data);
  }

  // Department methods - delegate to departmentService
  async getDepartments() {
    return departmentService.getDepartments();
  }

  async createDepartment(data: { name: string; description?: string }) {
    return departmentService.createDepartment(data);
  }

  async updateDepartment(data: { id: number; name: string; description?: string }) {
    return departmentService.updateDepartment(data);
  }

  async deleteDepartment(id: number) {
    return departmentService.deleteDepartment(id);
  }

  // Division methods
  async getDivisions(): Promise<Division[]> {
    try {
      const response = await this.makeRequest('/divisions/index.php', {
        method: 'GET',
      });
      return response as Division[];
    } catch (error) {
      console.error('Error fetching divisions:', error);
      return [];
    }
  }

  async createDivision(data: { name: string; department_id: number; description?: string }): Promise<Response> {
    return this.makeRequest('/divisions/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDivision(data: { id: number; name: string; department_id: number; description?: string }): Promise<Response> {
    return this.makeRequest('/divisions/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDivision(id: number): Promise<Response> {
    return this.makeRequest(`/divisions/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // User methods - delegate to userService
  async getUsers() {
    return userService.getUsers();
  }

  // Add password update method
  async updatePassword(data: { id: number; currentPassword: string; newPassword: string }) {
    return authService.updatePassword(data);
  }

  async createUser(data: {
    name: string;
    nic: string;
    email: string;
    username: string;
    password: string;
    role: string;
    department_id?: number | null;
    division_id?: number | null;
  }) {
    return userService.createUser(data);
  }

  async updateUser(data: {
    id: number;
    name: string;
    nic: string;
    email: string;
    username: string;
    password?: string;
    role: string;
    department_id?: number | null;
    division_id?: number | null;
  }) {
    return userService.updateUser(data);
  }

  async deleteUser(id: number) {
    return userService.deleteUser(id);
  }

  // Public user methods
  async getPublicUsers(): Promise<PublicUser[]> {
    try {
      const response = await this.makeRequest('/public-users/index.php');
      if (!response) {
        throw new Error('No response from server');
      }
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to fetch public users');
      }
      if (response.status === 'success' && Array.isArray(response.data)) {
        return response.data.map((user: PublicUser) => ({
          ...user,
          created_at: user.created_at || new Date().toISOString()
        }));
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching public users:', error);
      throw error;
    }
  }

  async getPublicUserById(id: string): Promise<PublicUser | null> {
    try {
      const response = await this.makeRequest(`/public-users/index.php?id=${id}`);
      if (response?.status === 'success' && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching public user:', error);
      throw error;
    }
  }

  async createPublicUser(data: {
    name: string;
    nic: string;
    address: string;
    mobile: string;
    email: string;
    username: string;
    password: string;
    department_id?: number;
    division_id?: number;
  }): Promise<{ status: string; data?: PublicUser; message?: string }> {
    try {
      const response = await this.makeRequest('/public-users/index.php', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Error creating public user:', error);
      throw error;
    }
  }

  // Notification methods - delegate to notificationService
  async getNotifications(recipientId: number, recipientType?: 'public' | 'staff') {
    return notificationService.getNotifications(recipientId, recipientType);
  }

  async createNotification(data: {
    recipient_id: number;
    recipient_type?: 'public' | 'staff';
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }) {
    return notificationService.createNotification(data);
  }

  async markNotificationAsRead(id: number) {
    return notificationService.markNotificationAsRead(id);
  }

  // Token methods
  async getTokens(date?: string): Promise<Token[]> {
    try {
      let endpoint = '/tokens/index.php';
      if (date) endpoint += `?date=${date}`;
      const response = await this.makeRequest(endpoint);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }
  }

  async createToken(data: { department_id: number; division_id: number }): Promise<{ token_number: number; token_id: number }> {
    try {
      const response = await this.makeRequest('/tokens/index.php', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Handle the corrected response format from backend
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      if (response.status === 'error') {
        throw new Error(response.message || 'Token creation failed');
      }

      // Extract token details from the corrected response format
      const tokenNumber = response.token_number;
      const tokenId = response.token_id;

      if (!tokenNumber || !tokenId) {
        throw new Error('Missing token details in response');
      }

      return {
        token_number: tokenNumber,
        token_id: tokenId
      };
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }

  async updateToken(data: { id: number; status: 'active' | 'called' | 'completed' }) {
    try {
      const response = await this.makeRequest('/tokens/index.php', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from server');
      }

      return response;
    } catch (error) {
      console.error('Error updating token:', error);
      throw error;
    }
  }

  // Service history methods
  async getServiceHistory(userId: number): Promise<ServiceHistory[]> {
    try {
      const response = await this.makeRequest(`/service-history/index.php?user_id=${userId}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching service history:', error);
      return [];
    }
  }

  async addServiceHistory(data: {
    public_user_id: number;
    department_id: number;
    division_id: number;
    service_name: string;
    staff_user_id: number;
  }) {
    return this.makeRequest('/service-history/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // QR scan methods
  async recordQRScan(data: {
    public_user_id: number;
    staff_user_id: number;
    scan_purpose: string;
    scan_location: string;
  }) {
    return this.makeRequest('/qr-scans/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
