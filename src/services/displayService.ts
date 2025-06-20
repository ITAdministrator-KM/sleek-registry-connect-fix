
import { ApiBase } from './apiBase';

export interface DisplayToken {
  id: number;
  token_number: number;
  status: 'active' | 'called' | 'serving' | 'completed';
  department_name: string;
  division_name: string;
  department_id: number;
  division_id: number;
  created_at: string;
  called_at?: string;
  updated_at: string;
  position_in_queue: number;
}

export interface DisplayStats {
  total_tokens_today: number;
  waiting_tokens: number;
  serving_tokens: number;
  completed_tokens: number;
}

export interface DisplayDepartment {
  id: number;
  name: string;
  total_tokens: number;
  waiting_tokens: number;
  serving_tokens: number;
}

export interface DisplayResponse {
  tokens: DisplayToken[];
  statistics: DisplayStats;
  departments: DisplayDepartment[];
  last_updated: string;
}

export class DisplayService extends ApiBase {
  async getCurrentTokens(): Promise<DisplayResponse> {
    try {
      const response = await fetch('https://dskalmunai.lk/backend/api/display/current-tokens.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch current tokens');
      }
    } catch (error) {
      console.error('Error fetching current tokens:', error);
      throw error;
    }
  }

  async updateTokenStatus(tokenId: number, status: 'called' | 'serving' | 'completed'): Promise<void> {
    try {
      const response = await this.makeRequest(`/tokens/${tokenId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status,
          called_at: status === 'called' ? new Date().toISOString() : undefined
        }),
      });

      return response;
    } catch (error) {
      console.error('Error updating token status:', error);
      throw error;
    }
  }
}

export const displayService = new DisplayService();
