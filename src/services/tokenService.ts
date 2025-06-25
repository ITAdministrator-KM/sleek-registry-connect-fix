
import { ApiBase } from './apiBase';

export interface Token {
  id: string;
  token_number: string;
  registry_id: string;
  department_id: string;
  division_id: string;
  service_type: string;
  queue_position: number;
  status: 'waiting' | 'called' | 'serving' | 'served' | 'cancelled' | 'expired';
  priority_level: 'normal' | 'urgent' | 'vip';
  estimated_service_time: number;
  actual_service_time?: number;
  wait_time_minutes: number;
  created_at: string;
  called_at?: string;
  serving_started_at?: string;
  served_at?: string;
  cancelled_at?: string;
  staff_id?: string;
  notes?: string;
  visitor_name?: string;
  visitor_nic?: string;
  purpose_of_visit?: string;
  department_name?: string;
  division_name?: string;
  staff_name?: string;
  total_wait_minutes?: number;
}

export interface QueueStatus {
  total_tokens_issued: number;
  tokens_served: number;
  tokens_waiting: number;
  tokens_cancelled: number;
  average_service_time: number;
  estimated_wait_time: number;
  current_serving_token?: string;
  last_called_token?: string;
  active_tokens: number;
  department_name?: string;
  division_name?: string;
}

export interface TokenGenerateRequest {
  registry_id: string;
  department_id: string;
  division_id: string;
  service_type?: string;
  priority_level?: 'normal' | 'urgent' | 'vip';
  created_by?: string;
}

export interface TokenResponse {
  token_id: string;
  token_number: string;
  queue_position: number;
  estimated_wait_time: number;
  status: string;
  priority_level: string;
  service_type: string;
}

export interface TokenListParams {
  department_id?: string;
  division_id?: string;
  date?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface TokenListResponse {
  tokens: Token[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    date: string;
  };
}

export class TokenService extends ApiBase {
  private wsConnection?: WebSocket;
  private listeners: Map<string, (data: any) => void> = new Map();

  // Generate new token
  async generateToken(data: TokenGenerateRequest): Promise<TokenResponse> {
    try {
      const response = await this.makeRequest('/tokens/', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          created_by: localStorage.getItem('userId') || data.created_by
        }),
      });

      if (response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate token. Please try again.');
    }
  }

  // Get tokens list with filtering
  async getTokens(params: TokenListParams = {}): Promise<TokenListResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('action', 'list');
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await this.makeRequest(`/tokens/?${queryParams.toString()}`);
      
      if (response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch tokens');
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return { tokens: [], meta: { total: 0, limit: 50, offset: 0, date: new Date().toISOString().split('T')[0] } };
    }
  }

  // Get next token to serve
  async getNextToken(departmentId: string, divisionId: string): Promise<{ token_id: string | null; token_number: string | null; status: string; message?: string }> {
    try {
      const staffId = localStorage.getItem('userId');
      if (!staffId) {
        throw new Error('Staff ID not found. Please log in again.');
      }

      const queryParams = new URLSearchParams({
        action: 'next',
        department_id: departmentId,
        division_id: divisionId,
        staff_id: staffId
      });

      const response = await this.makeRequest(`/tokens/?${queryParams.toString()}`);
      
      if (response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get next token');
      }
    } catch (error) {
      console.error('Error getting next token:', error);
      throw new Error('Failed to get next token. Please try again.');
    }
  }

  // Get queue status
  async getQueueStatus(departmentId: string, divisionId: string): Promise<QueueStatus> {
    try {
      const queryParams = new URLSearchParams({
        action: 'queue',
        department_id: departmentId,
        division_id: divisionId
      });

      const response = await this.makeRequest(`/tokens/?${queryParams.toString()}`);
      
      if (response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get queue status');
      }
    } catch (error) {
      console.error('Error getting queue status:', error);
      return {
        total_tokens_issued: 0,
        tokens_served: 0,
        tokens_waiting: 0,
        tokens_cancelled: 0,
        average_service_time: 15,
        estimated_wait_time: 0,
        active_tokens: 0
      };
    }
  }

  // Complete token service
  async completeToken(tokenId: string, notes?: string): Promise<{ status: string }> {
    try {
      const staffId = localStorage.getItem('userId');
      if (!staffId) {
        throw new Error('Staff ID not found. Please log in again.');
      }

      const response = await this.makeRequest('/tokens/', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'complete',
          token_id: tokenId,
          staff_id: staffId,
          notes: notes || ''
        }),
      });

      if (response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to complete token');
      }
    } catch (error) {
      console.error('Error completing token:', error);
      throw new Error('Failed to complete token. Please try again.');
    }
  }

  // Cancel token
  async cancelToken(tokenId: string, reason?: string): Promise<{ status: string }> {
    try {
      const staffId = localStorage.getItem('userId');
      if (!staffId) {
        throw new Error('Staff ID not found. Please log in again.');
      }

      const response = await this.makeRequest('/tokens/', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'cancel',
          token_id: tokenId,
          staff_id: staffId,
          reason: reason || 'Cancelled by staff'
        }),
      });

      if (response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to cancel token');
      }
    } catch (error) {
      console.error('Error cancelling token:', error);
      throw new Error('Failed to cancel token. Please try again.');
    }
  }

  // Start serving token
  async startServingToken(tokenId: string): Promise<{ status: string }> {
    try {
      const staffId = localStorage.getItem('userId');
      if (!staffId) {
        throw new Error('Staff ID not found. Please log in again.');
      }

      const response = await this.makeRequest('/tokens/', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'start_serving',
          token_id: tokenId,
          staff_id: staffId
        }),
      });

      if (response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to start serving token');
      }
    } catch (error) {
      console.error('Error starting token service:', error);
      throw new Error('Failed to start serving token. Please try again.');
    }
  }

  // WebSocket connection for real-time updates
  connectWebSocket(departmentId: string, divisionId: string) {
    try {
      // Close existing connection
      this.disconnectWebSocket();

      // Note: This would require a WebSocket server implementation
      // For now, we'll use polling as a fallback
      console.log('WebSocket connection would be established here for real-time updates');
      
      // Start polling for updates every 30 seconds
      this.startPolling(departmentId, divisionId);
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      // Fallback to polling
      this.startPolling(departmentId, divisionId);
    }
  }

  disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = undefined;
    }
    this.stopPolling();
  }

  private pollingInterval?: NodeJS.Timeout;

  private startPolling(departmentId: string, divisionId: string) {
    this.stopPolling();
    
    this.pollingInterval = setInterval(async () => {
      try {
        const queueStatus = await this.getQueueStatus(departmentId, divisionId);
        this.notifyListeners('queue_update', queueStatus);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // Poll every 30 seconds
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  // Event listeners for real-time updates
  onQueueUpdate(callback: (data: QueueStatus) => void) {
    this.listeners.set('queue_update', callback);
  }

  onTokenUpdate(callback: (data: Token) => void) {
    this.listeners.set('token_update', callback);
  }

  removeListener(event: string) {
    this.listeners.delete(event);
  }

  private notifyListeners(event: string, data: any) {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  // Backward compatibility methods
  async createToken(data: { department_id: string; division_id: string; registry_id: string }): Promise<TokenResponse> {
    return this.generateToken({
      registry_id: data.registry_id,
      department_id: data.department_id,
      division_id: data.division_id
    });
  }

  async updateTokenStatus(tokenId: string, status: Token['status']): Promise<{ status: string }> {
    switch (status) {
      case 'served':
        return this.completeToken(tokenId);
      case 'cancelled':
        return this.cancelToken(tokenId);
      case 'serving':
        return this.startServingToken(tokenId);
      default:
        throw new Error(`Status ${status} cannot be updated directly`);
    }
  }
}

export const tokenService = new TokenService();
