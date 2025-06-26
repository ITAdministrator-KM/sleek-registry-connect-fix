
export interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email?: string;
  username?: string;
  password?: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  date_of_birth?: string;
  created_at?: string;
  updated_at?: string;
  status: 'active' | 'inactive' | 'deleted';
}

export interface Token {
  id: number;
  token_number: string;
  registry_id?: number;
  department_id: number;
  division_id?: number;
  public_user_id?: number;
  service_type?: string;
  priority_level?: 'low' | 'normal' | 'high' | 'urgent';
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled' | 'no_show';
  queue_position?: number;
  estimated_wait_time?: number;
  created_at: string;
  called_at?: string;
  served_at?: string;
  completed_at?: string;
  staff_id?: number;
  visitor_name?: string;
  purpose_of_visit?: string;
  total_wait_minutes?: number;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface Division {
  id: number;
  department_id: number;
  name: string;
  description?: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'staff' | 'public';
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  nic?: string;
  status: 'active' | 'inactive';
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_type: 'all' | 'individual' | 'department' | 'division';
  target_id?: number;
  sender_id: number;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  department_id: number;
}

export interface ServiceCatalog {
  id: number;
  name: string;
  description?: string;
  department_id: number;
  department_name?: string;
  requirements?: string;
  processing_time?: string;
  fees?: string;
  status: 'active' | 'inactive';
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Public Users
  async getPublicUsers(): Promise<PublicUser[]> {
    return this.makeRequest('/public-users/index.php');
  }

  async getPublicUser(id: number): Promise<PublicUser> {
    return this.makeRequest(`/public-users/index.php?id=${id}`);
  }

  async createPublicUser(userData: Omit<PublicUser, 'id' | 'public_id' | 'created_at' | 'updated_at'>): Promise<PublicUser> {
    return this.makeRequest('/public-users/index.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updatePublicUser(id: number, userData: Partial<PublicUser>): Promise<PublicUser> {
    return this.makeRequest('/public-users/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
  }

  async deletePublicUser(id: number): Promise<void> {
    return this.makeRequest('/public-users/index.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.makeRequest('/users/index.php');
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    return this.makeRequest('/users/index.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return this.makeRequest('/users/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.makeRequest('/users/index.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Tokens
  async getTokens(): Promise<Token[]> {
    return this.makeRequest('/tokens/index.php');
  }

  async createToken(tokenData: Omit<Token, 'id' | 'token_number' | 'created_at'>): Promise<Token> {
    return this.makeRequest('/tokens/index.php', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return this.makeRequest('/departments/index.php');
  }

  // Divisions
  async getDivisions(departmentId?: number): Promise<Division[]> {
    const endpoint = departmentId ? `/divisions/index.php?department_id=${departmentId}` : '/divisions/index.php';
    return this.makeRequest(endpoint);
  }

  // Staff
  async getStaff(): Promise<Staff[]> {
    return this.makeRequest('/staff/index.php');
  }

  // Services
  async getServices(): Promise<ServiceCatalog[]> {
    return this.makeRequest('/service-catalog/index.php');
  }

  async getPublicServices(): Promise<ServiceCatalog[]> {
    return this.makeRequest('/service-catalog/index.php?public=true');
  }

  async createService(serviceData: Omit<ServiceCatalog, 'id'>): Promise<ServiceCatalog> {
    return this.makeRequest('/service-catalog/index.php', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: number, serviceData: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    return this.makeRequest('/service-catalog/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...serviceData }),
    });
  }

  async deleteService(id: number): Promise<void> {
    return this.makeRequest('/service-catalog/index.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.makeRequest('/notifications/index.php');
  }

  async createNotification(notificationData: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    return this.makeRequest('/notifications/index.php', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }
}

export const apiService = new ApiService();
