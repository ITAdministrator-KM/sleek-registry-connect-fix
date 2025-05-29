
import { ApiBase } from './apiBase';

interface LoginData {
  username: string;
  password: string;
  role: string;
}

interface LoginResponse {
  status: string;
  message: string;
  data?: {
    user: any;
    token: string;
    expires_at: number;
  };
}

export class AuthService extends ApiBase {
  async login(data: LoginData): Promise<any> {
    const response = await this.makeRequest('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log('Login service response:', response);
    
    // Handle different response formats
    if (response && typeof response === 'object') {
      if (response.status === 'success' && response.data) {
        return { data: response.data };
      }
      // Handle direct data response format
      if (response.user && response.token) {
        return { data: response };
      }
    }
    
    throw new Error('Invalid login response format');
  }
}

export const authService = new AuthService();
