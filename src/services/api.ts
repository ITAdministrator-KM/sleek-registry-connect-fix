
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

class ApiService extends ApiBase {
  async login(data: LoginData): Promise<any> {
    return authService.login(data);
  }

  async getDepartments() {
    return this.makeRequest('/departments/index.php');
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

  async getDivisions() {
    return this.makeRequest('/divisions/index.php');
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

  async getUsers() {
    return this.makeRequest('/users/index.php');
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

  async getPublicUsers() {
    return this.makeRequest('/public-users/index.php');
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

  async getNotifications(recipientId: number, recipientType?: 'public' | 'staff') {
    let endpoint = `/notifications/index.php?recipient_id=${recipientId}`;
    if (recipientType) endpoint += `&recipient_type=${recipientType}`;
    return this.makeRequest(endpoint);
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
}

export const apiService = new ApiService();
export type { LoginData, ApiResponse };
