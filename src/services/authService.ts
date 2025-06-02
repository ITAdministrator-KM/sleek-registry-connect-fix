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
    try {
      const response = await this.makeRequest('/auth/login.php', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('Auth service response:', JSON.stringify(response, null, 2));
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        if (response.status === 'success' && response.data) {
          console.log('Using success/data format');
          return { data: response.data };
        }
        // Handle direct data response format
        if (response.user && response.token) {
          console.log('Using direct data format');
          return { data: response };
        }
        
        console.error('Invalid response format:', response);
        throw new Error('Invalid login response format. Expected user and token data.');
      }
      
      throw new Error('Invalid response type from server');
    } catch (error) {
      console.error('Login request failed:', error);
      throw error;
    }
  }

  async updatePassword(data: { id: number; currentPassword: string; newPassword: string }): Promise<any> {
    try {
      const response = await this.makeRequest('/users/password.php', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response?.status === 'success') {
        return { success: true, message: response.message };
      }
      throw new Error(response?.message || 'Failed to update password');
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
