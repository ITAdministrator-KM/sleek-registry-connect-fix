import { apiBase } from './apiBase';

export interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email: string;
  username: string;
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
  role: 'admin' | 'staff';
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

export interface Token {
  id: number;
  token_number: string;
  service_type: string;
  priority: 'normal' | 'urgent';
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled';
  issued_by: number;
  issued_by_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface QRScan {
  public_user_id: number;
  staff_user_id: number;
  scan_purpose: string;
  scan_location: string;
}

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_audience: 'all' | 'public' | 'staff';
  department_ids?: number[];
  division_ids?: number[];
}

export const apiService = {
  // Public Users CRUD
  async getPublicUsers(): Promise<PublicUser[]> {
    const response = await apiBase.get('/public-users');
    return response.data;
  },

  async getPublicUserById(id: number): Promise<PublicUser> {
    const response = await apiBase.get(`/public-users?id=${id}`);
    return response.data;
  },

  async createPublicUser(userData: Partial<PublicUser>): Promise<PublicUser> {
    const response = await apiBase.post('/public-users', userData);
    return response.data;
  },

  async updatePublicUser(userData: Partial<PublicUser> & { id: number }): Promise<PublicUser> {
    const response = await apiBase.put('/public-users', userData);
    return response.data;
  },

  async deletePublicUser(id: number): Promise<void> {
    await apiBase.delete('/public-users', { id });
  },

  // Users
  async getUsers(): Promise<User[]> {
    const response = await apiBase.get('/users');
    return response.data;
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await apiBase.post('/users', userData);
    return response.data;
  },

  async updateUser(userData: Partial<User> & { id: number }): Promise<User> {
    const response = await apiBase.put('/users', userData);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await apiBase.delete('/users', { id });
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    const response = await apiBase.get('/departments');
    return response.data;
  },

  async createDepartment(departmentData: Partial<Department>): Promise<Department> {
    const response = await apiBase.post('/departments', departmentData);
    return response.data;
  },

  async updateDepartment(departmentData: Partial<Department> & { id: number }): Promise<Department> {
    const response = await apiBase.put('/departments', departmentData);
    return response.data;
  },

  async deleteDepartment(id: number): Promise<void> {
    await apiBase.delete('/departments', { id });
  },

  // Divisions
  async getDivisions(): Promise<Division[]> {
    const response = await apiBase.get('/divisions');
    return response.data;
  },

  async createDivision(divisionData: Partial<Division>): Promise<Division> {
    const response = await apiBase.post('/divisions', divisionData);
    return response.data;
  },

  async updateDivision(divisionData: Partial<Division> & { id: number }): Promise<Division> {
    const response = await apiBase.put('/divisions', divisionData);
    return response.data;
  },

  async deleteDivision(id: number): Promise<void> {
    await apiBase.delete('/divisions', { id });
  },

  // Tokens
  async getTokens(): Promise<Token[]> {
    const response = await apiBase.get('/tokens');
    return response.data;
  },

  async createToken(tokenData: Partial<Token>): Promise<Token> {
    const response = await apiBase.post('/tokens', tokenData);
    return response.data;
  },

  async updateToken(tokenData: Partial<Token> & { id: number }): Promise<Token> {
    const response = await apiBase.put('/tokens', tokenData);
    return response.data;
  },

  async deleteToken(id: number): Promise<void> {
    await apiBase.delete('/tokens', { id });
  },

  // QR Scans
  async recordQRScan(scanData: QRScan): Promise<void> {
    await apiBase.post('/qr-scans', scanData);
  },

  // Notifications
  async sendNotification(notificationData: NotificationData): Promise<void> {
    await apiBase.post('/notifications', notificationData);
  },

  async getNotifications(): Promise<any[]> {
    const response = await apiBase.get('/notifications');
    return response.data;
  },
};
