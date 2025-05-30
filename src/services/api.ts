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

// Add alias for backward compatibility
export interface Notification extends NotificationData {}

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

export interface NotificationMeta {
  total: number;
  unread: number;
  limit: number;
  offset: number;
}

export interface NotificationsResponse {
  status: 'success' | 'error';
  message: string;
  data: NotificationData[];
  meta: NotificationMeta;
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

  async updatePassword(data: { id: number; currentPassword: string; newPassword: string }): Promise<any> {
    const response = await this.makeRequest('/users/password.php', {
      method: 'POST',
      body: JSON.stringify({ 
        id: data.id,
        current_password: data.currentPassword, 
        new_password: data.newPassword 
      }),
    });
    return response.data;
  }

  // Public Users
  async getPublicUsers(): Promise<PublicUser[]> {
    const response = await this.makeRequest('/public-users/');
    return Array.isArray(response.data) ? response.data : [];
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
    return Array.isArray(response.data) ? response.data : [];
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
    return Array.isArray(response.data) ? response.data : [];
  }

  async createDepartment(departmentData: { name: string; description: string }): Promise<Department> {
    const response = await this.makeRequest('/departments/', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
    return response.data;
  }

  async updateDepartment(data: { id: number; name: string; description: string }): Promise<Department> {
    const response = await this.makeRequest('/departments/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteDepartment(id: number): Promise<any> {
    const response = await this.makeRequest('/departments/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    return response.data;
  }

  // Divisions
  async getDivisions(departmentId?: number): Promise<Division[]> {
    const endpoint = departmentId ? `/divisions/?department_id=${departmentId}` : '/divisions/';
    const response = await this.makeRequest(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  }

  async createDivision(divisionData: { name: string; department_id: number; description: string }): Promise<Division> {
    const response = await this.makeRequest('/divisions/', {
      method: 'POST',
      body: JSON.stringify(divisionData),
    });
    return response.data;
  }

  async updateDivision(data: { id: number; name: string; department_id: number; description: string }): Promise<Division> {
    const response = await this.makeRequest('/divisions/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteDivision(id: number): Promise<any> {
    const response = await this.makeRequest('/divisions/', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
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
    return Array.isArray(response.data) ? response.data : [];
  }

  async updateTokenStatus(tokenId: number, status: Token['status']): Promise<Token> {
    const response = await this.makeRequest('/tokens/', {
      method: 'PUT',
      body: JSON.stringify({ id: tokenId, status }),
    });
    return response.data;
  }

  // Add alias for backward compatibility
  async updateToken(data: { id: number; status: Token['status'] }): Promise<Token> {
    return this.updateTokenStatus(data.id, data.status);
  }

  // Service History
  async getServiceHistory(publicUserId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    department_id?: number;
    from_date?: string;
    to_date?: string;
  }): Promise<{ data: any[]; meta: any }> {
    const queryParams = new URLSearchParams({
      public_user_id: publicUserId,
      ...(params?.page && { page: params.page.toString() }),
      ...(params?.limit && { limit: params.limit.toString() }),
      ...(params?.status && { status: params.status }),
      ...(params?.department_id && { department_id: params.department_id.toString() }),
      ...(params?.from_date && { from_date: params.from_date }),
      ...(params?.to_date && { to_date: params.to_date }),
    });

    const response = await this.makeRequest(`/service-history/?${queryParams}`);
    return response;
  }

  async addServiceHistory(data: {
    public_user_id: string;
    department_id: number;
    division_id: number;
    service_name: string;
    details?: string;
    staff_user_id?: number;
  }): Promise<any> {
    const response = await this.makeRequest('/service-history/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateServiceHistory(data: {
    id: number;
    status: string;
    details?: string;
  }): Promise<any> {
    const response = await this.makeRequest('/service-history/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<NotificationsResponse> {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      let endpoint = `/notifications/index.php?recipient_id=${userId}`;
      
      // Map admin role to staff for backend compatibility
      const recipientType = userRole === 'admin' ? 'staff' : userRole;
      if (recipientType) {
        endpoint += `&recipient_type=${recipientType}`;
      }
      
      const response = await this.makeRequest(endpoint);
      return response as NotificationsResponse;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        status: 'error',
        message: 'Failed to fetch notifications',
        data: [],
        meta: { total: 0, unread: 0, limit: 0, offset: 0 }
      };
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<{ status: string; message: string }> {
    const response = await this.makeRequest('/notifications/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id: notificationId, is_read: true }),
    });
    return response;
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
