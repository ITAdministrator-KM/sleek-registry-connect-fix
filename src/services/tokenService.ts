
import { apiService, Token } from './apiService';

interface TokenData {
  registry_id?: number;
  department_id: string | number;
  division_id?: string | number | null;
  public_user_id?: number;
  service_type?: string;
  priority_level?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface QueueStatus {
  tokens_waiting: number;
  tokens_served: number;
  total_tokens_issued: number;
  estimated_wait_time: number;
  average_service_time?: number;
  current_serving_token?: string;
}

export const tokenService = {
  async generateToken(data: TokenData) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/tokens/index.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          registry_id: data.registry_id,
          department_id: parseInt(data.department_id.toString()),
          division_id: data.division_id ? parseInt(data.division_id.toString()) : null,
          public_user_id: data.public_user_id,
          service_type: data.service_type || 'General Service',
          priority_level: data.priority_level || 'normal'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  },

  async getTokens(filters?: { department_id?: string; division_id?: string; date?: string; limit?: number }): Promise<{ tokens: Token[] }> {
    try {
      const tokens = await apiService.getTokens();
      let filteredTokens = tokens;

      if (filters) {
        filteredTokens = tokens.filter(token => {
          if (filters.department_id && token.department_id.toString() !== filters.department_id) return false;
          if (filters.division_id && token.division_id?.toString() !== filters.division_id) return false;
          if (filters.date) {
            const tokenDate = new Date(token.created_at).toDateString();
            const filterDate = new Date(filters.date).toDateString();
            if (tokenDate !== filterDate) return false;
          }
          return true;
        });

        if (filters.limit) {
          filteredTokens = filteredTokens.slice(0, filters.limit);
        }
      }

      return { tokens: filteredTokens };
    } catch (error) {
      console.error('Get tokens error:', error);
      return { tokens: [] };
    }
  },

  async getQueueStatus(departmentId: string, divisionId?: string): Promise<QueueStatus> {
    try {
      const tokens = await apiService.getTokens();
      const today = new Date().toDateString();
      
      const relevantTokens = tokens.filter(token => {
        const tokenDate = new Date(token.created_at).toDateString();
        const matchesDept = token.department_id.toString() === departmentId;
        const matchesDiv = !divisionId || token.division_id?.toString() === divisionId;
        return tokenDate === today && matchesDept && matchesDiv;
      });

      const waitingTokens = relevantTokens.filter(t => t.status === 'waiting').length;
      const servedTokens = relevantTokens.filter(t => t.status === 'completed').length;
      const currentServing = relevantTokens.find(t => t.status === 'serving');

      return {
        tokens_waiting: waitingTokens,
        tokens_served: servedTokens,
        total_tokens_issued: relevantTokens.length,
        estimated_wait_time: Math.max(5, waitingTokens * 8),
        average_service_time: 8,
        current_serving_token: currentServing?.token_number
      };
    } catch (error) {
      console.error('Queue status error:', error);
      return {
        tokens_waiting: 0,
        tokens_served: 0,
        total_tokens_issued: 0,
        estimated_wait_time: 0,
        average_service_time: 8
      };
    }
  },

  async getNextToken(departmentId: string, divisionId?: string) {
    try {
      const tokens = await apiService.getTokens();
      const nextToken = tokens
        .filter(t => t.department_id.toString() === departmentId && 
                    (!divisionId || t.division_id?.toString() === divisionId) &&
                    t.status === 'waiting')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

      if (nextToken) {
        await this.updateTokenStatus(nextToken.id, 'called');
        return { token_id: nextToken.id, token_number: nextToken.token_number };
      }
      return { token_id: null, token_number: null };
    } catch (error) {
      console.error('Get next token error:', error);
      throw error;
    }
  },

  async completeToken(tokenId: string, notes?: string) {
    return this.updateTokenStatus(parseInt(tokenId), 'completed');
  },

  async cancelToken(tokenId: string, reason?: string) {
    return this.updateTokenStatus(parseInt(tokenId), 'cancelled');
  },

  async startServingToken(tokenId: string) {
    return this.updateTokenStatus(parseInt(tokenId), 'serving');
  },

  async updateTokenStatus(tokenId: number, status: string, staffId?: number) {
    try {
      const updateData: any = { id: tokenId, status };
      
      if (status === 'called') {
        updateData.called_at = new Date().toISOString();
      } else if (status === 'serving') {
        updateData.served_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      if (staffId) {
        updateData.staff_id = staffId;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/tokens/index.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Token update error:', error);
      throw error;
    }
  },

  // Mock WebSocket methods for now
  connectWebSocket(departmentId: string, divisionId?: string) {
    console.log('WebSocket connection mock for', departmentId, divisionId);
  },

  disconnectWebSocket() {
    console.log('WebSocket disconnect mock');
  },

  onQueueUpdate(callback: (data: QueueStatus) => void) {
    console.log('Queue update listener mock');
  },

  removeListener(event: string) {
    console.log('Remove listener mock', event);
  }
};

export type { Token } from './apiService';
