
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
    expires_at?: number;
  };
  user?: any;
  token?: string;
}

export class AuthService extends ApiBase {
  async login(data: LoginData): Promise<any> {
    try {
      console.log('AuthService: Attempting login with:', { username: data.username, role: data.role });
      
      const response = await this.makeRequest('/auth/login.php', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('AuthService: Raw response:', JSON.stringify(response, null, 2));
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // Format 1: { status: 'success', data: { user, token } }
        if (response.status === 'success' && response.data) {
          console.log('AuthService: Using success/data format');
          return { 
            status: 'success',
            data: response.data 
          };
        }
        
        // Format 2: Direct response with user and token
        if (response.user && response.token) {
          console.log('AuthService: Using direct format');
          return { 
            status: 'success',
            data: {
              user: response.user,
              token: response.token
            }
          };
        }

        // Format 3: Success response with token and user at root level
        if (response.success && response.token && response.user) {
          console.log('AuthService: Using success format');
          return { 
            status: 'success',
            data: {
              user: response.user,
              token: response.token
            }
          };
        }
        
        // Handle error responses
        if (response.status === 'error') {
          throw new Error(response.message || 'Login failed');
        }
        
        console.error('AuthService: Invalid response format:', response);
        throw new Error('Invalid login response format. Expected user and token data.');
      }
      
      throw new Error('Invalid response type from server');
    } catch (error) {
      console.error('AuthService: Login request failed:', error);
      
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Network error during login. Please check your connection.');
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
