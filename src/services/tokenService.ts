
import { apiService } from './apiService';

interface TokenData {
  registry_id?: number;
  department_id: string | number;
  division_id?: string | number | null;
  public_user_id?: number;
  service_type?: string;
  priority_level?: 'low' | 'normal' | 'high' | 'urgent';
}

interface QueueStatus {
  tokens_waiting: number;
  tokens_served: number;
  total_tokens_issued: number;
  estimated_wait_time: number;
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

  async getQueueStatus(departmentId: string, divisionId?: string): Promise<QueueStatus> {
    try {
      const tokens = await apiService.getTokens();
      const today = new Date().toDateString();
      
      // Filter tokens for today and specific department/division
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
        current_serving_token: currentServing?.token_number
      };
    } catch (error) {
      console.error('Queue status error:', error);
      return {
        tokens_waiting: 0,
        tokens_served: 0,
        total_tokens_issued: 0,
        estimated_wait_time: 0
      };
    }
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
  }
};
