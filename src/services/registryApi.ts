
import { ApiBase } from './apiBase';

export interface RegistryEntry {
  id: number;
  registry_id?: string;
  public_user_id?: number;
  visitor_id?: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_address?: string;
  visitor_phone?: string;
  department_id: number;
  division_id?: number;
  purpose_of_visit: string;
  remarks?: string;
  entry_time: string;
  exit_time?: string;
  visitor_type: 'new' | 'existing';
  status: 'active' | 'checked_out' | 'deleted';
  department_name?: string;
  division_name?: string;
  created_at?: string;
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
  check_in?: string;
  status?: 'active' | 'checked_out' | 'deleted';
}

class RegistryApiService extends ApiBase {
  async getRegistryEntries(filters: {
    date?: string;
    departmentId?: number;
    status?: string;
    visitorType?: 'new' | 'existing';
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<RegistryEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.departmentId) params.append('department_id', filters.departmentId.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.visitorType) params.append('visitor_type', filters.visitorType);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/registry/index.php?${queryString}` : '/registry/index.php';
      
      console.log('Fetching registry entries from:', url);
      const response = await this.makeRequest(url);
      console.log('Registry API response:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response?.entries && Array.isArray(response.entries)) {
        return response.entries;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      return [];
    }
  }

  async createRegistryEntry(entryData: RegistryEntryCreateData): Promise<RegistryEntry> {
    try {
      console.log('Creating registry entry with data:', entryData);
      
      // Ensure required fields are present
      const payload = {
        ...entryData,
        entry_time: entryData.check_in || new Date().toISOString(),
        status: entryData.status || 'active'
      };
      
      const response = await this.makeRequest('/registry/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('Registry creation response:', response);
      return response?.data || response;
    } catch (error) {
      console.error('Error creating registry entry:', error);
      throw error;
    }
  }

  async updateRegistryEntry(id: number, entryData: Partial<RegistryEntry>): Promise<RegistryEntry> {
    try {
      const response = await this.makeRequest('/registry/index.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entryData, id })
      });
      
      return response?.data || response;
    } catch (error) {
      console.error('Error updating registry entry:', error);
      throw error;
    }
  }

  async checkOutVisitor(entryId: number): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/registry/index.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entryId,
          status: 'checked_out',
          exit_time: new Date().toISOString()
        })
      });
      
      return response?.success || true;
    } catch (error) {
      console.error('Error checking out visitor:', error);
      return false;
    }
  }

  async exportRegistryData(filters: {
    date?: string;
    format: 'csv' | 'pdf';
    departmentId?: number;
    divisionId?: number;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        format: filters.format,
        ...(filters.date && { date: filters.date }),
        ...(filters.departmentId && { department_id: filters.departmentId.toString() }),
        ...(filters.divisionId && { division_id: filters.divisionId.toString() })
      });

      const response = await fetch(`${this.baseURL}/registry/export.php?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting registry data:', error);
      throw error;
    }
  }
}

export const registryApiService = new RegistryApiService();
