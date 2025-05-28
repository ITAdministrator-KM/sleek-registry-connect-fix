const API_BASE_URL = 'https://dskalmunai.lk/backend/api';

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

interface CreateTokenResponse {
  message: string;
  token_id: number;
  token_number: number;
}

interface ApiToken {
  id: number;
  token_number: number;
  department_id: number;
  division_id: number;
  department_name: string;
  division_name: string;
  status: 'active' | 'called' | 'completed';
  created_at: string;
}

interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email?: string;
  photo?: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  created_at: string;
  status: string;
}

interface Appointment {
  id: number;
  public_user_id: number;
  department_id: number;
  division_id: number;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  description?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  staff_user_id?: number;
  created_at: string;
  public_user_name?: string;
  department_name?: string;
  division_name?: string;
}

interface ServiceHistoryEntry {
  id: number;
  public_user_id: number;
  department_id: number;
  division_id: number;
  service_name: string;
  status: 'completed' | 'pending' | 'processing';
  details?: string;
  staff_user_id?: number;
  created_at: string;
  department_name?: string;
  division_name?: string;
}

interface Notification {
  id: number;
  recipient_id: number;
  recipient_type: 'public' | 'staff';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

interface QRScan {
  id: number;
  public_user_id: number;
  staff_user_id: number;
  scan_location?: string;
  scan_purpose?: string;
  created_at: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making request to: ${url}`);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      console.log('Response status:', response.status);
      console.log('Response content-type:', contentType);
      
      if (contentType && !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error(`Invalid response type: ${contentType}. Server returned: ${textResponse.substring(0, 200)}...`);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.details || `HTTP error! status: ${response.status}`);
      }
      
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during API request');
    }
  }

  async login(data: LoginData): Promise<any> {
    const response = await this.makeRequest('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Handle different response formats
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    return response;
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

  async getTokens(date?: string): Promise<ApiToken[]> {
    const endpoint = date ? `/tokens/index.php?date=${date}` : '/tokens/index.php';
    return this.makeRequest(endpoint);
  }

  async createToken(data: { 
    department_id: number;
    division_id: number;
    public_user_id?: number;
  }): Promise<CreateTokenResponse> {
    return this.makeRequest('/tokens/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateToken(data: {
    id: number;
    status: 'active' | 'called' | 'completed';
  }): Promise<{ message: string }> {
    return this.makeRequest('/tokens/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPublicUsers(): Promise<PublicUser[]> {
    return this.makeRequest('/public-users/index.php');
  }

  async getPublicUserById(id: string): Promise<PublicUser> {
    return this.makeRequest(`/public-users/index.php?id=${id}`);
  }

  async createPublicUser(data: {
    name: string;
    nic: string;
    address: string;
    mobile: string;
    email?: string;
    department_id?: number;
    division_id?: number;
  }): Promise<{ message: string; public_id: string }> {
    return this.makeRequest('/public-users/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePublicUser(data: {
    id: number;
    name: string;
    nic: string;
    address: string;
    mobile: string;
    email?: string;
    department_id?: number;
    division_id?: number;
  }): Promise<{ message: string }> {
    return this.makeRequest('/public-users/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePublicUser(id: number): Promise<{ message: string }> {
    return this.makeRequest(`/public-users/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  async getAppointments(date?: string, status?: string): Promise<Appointment[]> {
    let endpoint = '/appointments/index.php';
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;
    
    return this.makeRequest(endpoint);
  }

  async createAppointment(data: {
    public_user_id: number;
    department_id: number;
    division_id: number;
    appointment_date: string;
    appointment_time: string;
    purpose: string;
    description?: string;
  }): Promise<{ message: string }> {
    return this.makeRequest('/appointments/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(data: {
    id: number;
    status: Appointment['status'];
    notes?: string;
    staff_user_id?: number;
  }): Promise<{ message: string }> {
    return this.makeRequest('/appointments/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id: number): Promise<{ message: string }> {
    return this.makeRequest(`/appointments/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  async getServiceHistory(publicUserId: number): Promise<ServiceHistoryEntry[]> {
    return this.makeRequest(`/service-history/index.php?public_user_id=${publicUserId}`);
  }

  async addServiceHistory(data: {
    public_user_id: number;
    department_id: number;
    division_id: number;
    service_name: string;
    details?: string;
    staff_user_id?: number;
  }): Promise<{ message: string }> {
    return this.makeRequest('/service-history/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateServiceStatus(data: {
    id: number;
    status: ServiceHistoryEntry['status'];
    details?: string;
  }): Promise<{ message: string }> {
    return this.makeRequest('/service-history/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getNotifications(recipientId: number, recipientType?: 'public' | 'staff'): Promise<Notification[]> {
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
  }): Promise<{ message: string }> {
    return this.makeRequest('/notifications/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markNotificationAsRead(id: number): Promise<{ message: string }> {
    return this.makeRequest('/notifications/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, is_read: true }),
    });
  }

  async recordQRScan(data: {
    public_user_id: number;
    staff_user_id: number;
    scan_location?: string;
    scan_purpose?: string;
  }): Promise<{ message: string }> {
    return this.makeRequest('/qr-scans/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQRScans(publicUserId: number): Promise<QRScan[]> {
    return this.makeRequest(`/qr-scans/index.php?public_user_id=${publicUserId}`);
  }
}

export const apiService = new ApiService();
export type { 
  LoginData, 
  ApiResponse,
  Appointment,
  ServiceHistoryEntry,
  Notification,
  QRScan
};
