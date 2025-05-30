
import { ApiBase } from './apiBase';

export type UserRole = 'admin' | 'staff' | 'public';

export interface NotificationData {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
}

export interface Token {
  id: number;
  token_number: number;
  department_id: number;
  division_id: number;
  department_name?: string;
  division_name?: string;
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface LoginResponseData {
  user: User;
  token: string;
  expires_at: number;
}

export interface LoginResponse {
  status: 'success' | 'error';
  message: string;
  data?: LoginResponseData;
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
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  nic: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  status: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export interface Division {
  id: number;
  name: string;
  department_id: number;
  department_name?: string;
  description: string;
  status: string;
  created_at: string;
}

class ApiService extends ApiBase {
  // Auth
  async login(data: { username: string; password: string; role: string }): Promise<LoginResponse> {
    const response = await this.makeRequest('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await this.makeRequest('/users/password.php', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    return response.data;
  }

  // Public Users
  async getPublicUsers(): Promise<PublicUser[]> {
    const response = await this.makeRequest('/public-users/');
    return response.data;
  }

  async getPublicUserById(id: number): Promise<PublicUser> {
    const response = await this.makeRequest(`/public-users/?id=${id}`);
    return response.data;
  }

  async createPublicUser(userData: Partial<PublicUser>): Promise<PublicUser> {
    const response = await this.makeRequest('/public-users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async updatePublicUser(id: number, userData: Partial<PublicUser>): Promise<PublicUser> {
    const response = await this.makeRequest('/public-users/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response.data;
  }

  async deletePublicUser(id: number): Promise<any> {
    const response = await this.makeRequest('/public-users/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Users
  async getUsers(): Promise<User[]> {
    const response = await this.makeRequest('/users/');
    return response.data;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await this.makeRequest('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await this.makeRequest('/users/', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
    return response.data;
  }

  async deleteUser(id: number): Promise<any> {
    const response = await this.makeRequest('/users/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    const response = await this.makeRequest('/departments/');
    return response.data;
  }

  // Divisions
  async getDivisions(departmentId?: number): Promise<Division[]> {
    const endpoint = departmentId ? `/divisions/?department_id=${departmentId}` : '/divisions/';
    const response = await this.makeRequest(endpoint);
    return response.data;
  }

  // Tokens
  async createToken(tokenData: { department_id: number; division_id: number }): Promise<Token> {
    const response = await this.makeRequest('/tokens/', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
    return response.data;
  }

  async getTokens(departmentId?: number): Promise<Token[]> {
    const endpoint = departmentId ? `/tokens/?department_id=${departmentId}` : '/tokens/';
    const response = await this.makeRequest(endpoint);
    return response.data;
  }

  async updateTokenStatus(tokenId: number, status: Token['status']): Promise<Token> {
    const response = await this.makeRequest('/tokens/', {
      method: 'PUT',
      body: JSON.stringify({ id: tokenId, status }),
    });
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<NotificationData[]> {
    const response = await this.makeRequest('/notifications/');
    return response.data;
  }

  async markNotificationAsRead(notificationId: number): Promise<any> {
    const response = await this.makeRequest('/notifications/', {
      method: 'PUT',
      body: JSON.stringify({ id: notificationId, is_read: true }),
    });
    return response.data;
  }

  // QR Scans
  async recordQRScan(scanData: {
    public_user_id: number;
    staff_user_id: number;
    scan_purpose: string;
    scan_location: string;
  }): Promise<any> {
    const response = await this.makeRequest('/qr-scans/', {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
    return response.data;
  }
}

export const apiService = new ApiService();
