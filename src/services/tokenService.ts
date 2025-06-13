import { ApiBase } from './apiBase';

export interface Token {
  id: number;
  token_number: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  service_id: number;
  service_name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export class TokenService extends ApiBase {
  async getTokens(): Promise<Token[]> {
    try {
      const response = await this.makeRequest('/tokens/');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      // If the error is 404, the tokens endpoint doesn't exist yet
      if (error.message.includes('404')) {
        console.warn('Tokens endpoint not found. This feature may not be implemented yet.');
        return [];
      }
      console.error('Error fetching tokens:', error);
      return [];
    }
  }

  async createToken(data: {
    service_id: number;
    user_id: number;
  }) {
    try {
      return await this.makeRequest('/tokens/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      // If the error is 404, the tokens endpoint doesn't exist yet
      if (error.message.includes('404')) {
        console.warn('Tokens endpoint not found. This feature may not be implemented yet.');
        return { success: false, message: 'Token management feature not available' };
      }
      throw error;
    }
  }
}

export const tokenService = new TokenService();
