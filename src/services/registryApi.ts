import { apiService } from './api';

export interface RegistryEntry {
  id: number;
  registry_id: string;
  public_user_id?: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_address?: string;
  visitor_phone?: string;
  department_id: number;
  division_id?: number;
  purpose_of_visit: string;
  remarks?: string;
  entry_time: string;
  visitor_type: 'new' | 'existing';
  status: 'active' | 'checked_out' | 'deleted';
  department_name?: string;
  division_name?: string;
  public_user_name?: string;
  public_user_id_display?: string;
  created_at: string;
  updated_at?: string;
}

export interface RegistryEntryCreateData {
  public_user_id?: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_address?: string;
  visitor_phone?: string;
  department_id: number;
  division_id?: number;
  purpose_of_visit: string;
  remarks?: string;
  visitor_type: 'new' | 'existing';
}

class RegistryApiService {
  private baseUrl = 'https://dskalmunai.lk/backend/api/registry';

  private async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }
      } catch (e) {
        console.error('Error parsing response:', e);
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      try {
        const textResponse = await response.text();
        console.warn('Non-JSON response received:', textResponse);
        // If it's HTML error page, throw error
        if (textResponse.includes('<html>') || textResponse.includes('<!DOCTYPE')) {
          throw new Error('Server returned HTML error page instead of JSON');
        }
        // Try to parse as JSON anyway
        return JSON.parse(textResponse);
      } catch (e) {
        throw new Error('Invalid response format. Expected JSON.');
      }
    }

    return await response.json();
  }

  async getRegistryEntries(params?: {
    date?: string;
    department_id?: number;
    division_id?: number;
    visitor_type?: 'new' | 'existing';
    status?: 'active' | 'checked_out' | 'deleted';
  }): Promise<RegistryEntry[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.department_id) queryParams.append('department_id', params.department_id.toString());
      if (params?.division_id) queryParams.append('division_id', params.division_id.toString());
      if (params?.visitor_type) queryParams.append('visitor_type', params.visitor_type);
      if (params?.status) queryParams.append('status', params.status);

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
      });

      const data = await this.handleResponse(response);
      
      // Handle different response formats
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) {
          return data.data;
        } else if (Array.isArray(data)) {
          return data;
        } else if (data.success && Array.isArray(data.entries)) {
          return data.entries;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      return [];
    }
  }

  async createRegistryEntry(data: RegistryEntryCreateData): Promise<RegistryEntry> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse(response);
      return result.data || result;
    } catch (error) {
      console.error('Error creating registry entry:', error);
      throw error;
    }
  }

  async exportRegistryData(params: {
    date?: string;
    department_id?: number;
    format: 'csv' | 'pdf';
  }): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams({
        export: params.format,
        ...(params.date && { date: params.date }),
        ...(params.department_id && { department_id: params.department_id.toString() })
      });

      const response = await fetch(`${this.baseUrl}/export?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, application/octet-stream',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting registry data:', error);
      throw error;
    }
  }
}

export const registryApiService = new RegistryApiService();
