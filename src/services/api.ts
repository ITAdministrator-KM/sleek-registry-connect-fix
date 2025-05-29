
import { ApiBase } from './apiBase';
import { authService } from './auth';

interface LoginData {
  username: string;
  password: string;
  role: string;
}

interface ApiResponse<T = any> {
  status?: string;
  message?: string;
  user?: T;
  token?: string;
  data?: T;
}

export interface Notification {
  id: number;
  recipient_id: number;
  recipient_type: 'public' | 'staff';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

interface Token {
  id: number;
  token_number: number;
  department_id: number;
  division_id: number;
  department_name: string;
  division_name: string;
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
  department_id?: number;
  division_id?: number;
  status: string;
  created_at: string;
}

class ApiService extends ApiBase {
  async login(data: LoginData): Promise<any> {
    return authService.login(data);
  }

  // Department methods
  async getDepartments(): Promise<any[]> {
    const response = await this.makeRequest('/departments/index.php');
    return Array.isArray(response) ? response : [];
  }

  async createDepartment(data: { name: string; description?: string }) {
    return this.makeRequest('/departments/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(data: { id: number; name: string; description?: string }) {
    return this.makeRequest('/departments/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: number) {
    return this.makeRequest(`/departments/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Division methods
  async getDivisions(): Promise<any[]> {
    const response = await this.makeRequest('/divisions/index.php');
    return Array.isArray(response) ? response : [];
  }

  async createDivision(data: { name: string; department_id: number; description?: string }) {
    return this.makeRequest('/divisions/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDivision(data: { id: number; name: string; department_id: number; description?: string }) {
    return this.makeRequest('/divisions/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDivision(id: number) {
    return this.makeRequest(`/divisions/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // User methods
  async getUsers(): Promise<any[]> {
    const response = await this.makeRequest('/users/index.php');
    return Array.isArray(response) ? response : [];
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
    return this.makeRequest('/users/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
    return this.makeRequest('/users/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.makeRequest(`/users/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Public user methods
  async getPublicUsers(): Promise<PublicUser[]> {
    const response = await this.makeRequest('/public-users/index.php');
    return Array.isArray(response) ? response : [];
  }

  async getPublicUserById(id: string): Promise<PublicUser> {
    const response = await this.makeRequest(`/public-users/index.php?id=${id}`);
    return response;
  }

  async createPublicUser(data: {
    name: string;
    nic: string;
    address: string;
    mobile: string;
    email?: string;
    department_id?: number;
    division_id?: number;
  }) {
    return this.makeRequest('/public-users/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notification methods
  async getNotifications(recipientId: number, recipientType?: 'public' | 'staff'): Promise<Notification[]> {
    let endpoint = `/notifications/index.php?recipient_id=${recipientId}`;
    if (recipientType) endpoint += `&recipient_type=${recipientType}`;
    const response = await this.makeRequest(endpoint);
    return Array.isArray(response) ? response : [];
  }

  async createNotification(data: {
    recipient_id: number;
    recipient_type?: 'public' | 'staff';
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }) {
    return this.makeRequest('/notifications/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markNotificationAsRead(id: number) {
    return this.makeRequest('/notifications/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, is_read: true }),
    });
  }

  // Token methods
  async getTokens(date?: string): Promise<Token[]> {
    let endpoint = '/tokens/index.php';
    if (date) endpoint += `?date=${date}`;
    const response = await this.makeRequest(endpoint);
    return Array.isArray(response) ? response : [];
  }

  async createToken(data: { department_id: number; division_id: number }) {
    return this.makeRequest('/tokens/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateToken(data: { id: number; status: string }) {
    return this.makeRequest('/tokens/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Service history methods
  async getServiceHistory(userId: number): Promise<ServiceHistory[]> {
    const response = await this.makeRequest(`/service-history/index.php?user_id=${userId}`);
    return Array.isArray(response) ? response : [];
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
export type { LoginData, ApiResponse, Token, ServiceHistory, PublicUser };
