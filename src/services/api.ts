const API_BASE_URL = 'https://dskalmunai.lk/backend/api';

interface LoginData {
  username: string;
  password: string;
  role: string;
}

interface ApiResponse<T = any> {
  message?: string;
  user?: T;
  token?: string;
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
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<ApiResponse> {
    return this.makeRequest('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
}

export const apiService = new ApiService();
export type { LoginData, ApiResponse };
