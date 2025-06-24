
import { ApiBase } from './apiBase';

export interface PublicVisitor {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address?: string;
  mobile?: string;
  email?: string;
  department_id?: number;
  division_id?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  last_visit?: string;
  visit_count: number;
  qr_code?: string;
  department_name?: string;
  division_name?: string;
}

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
  checked_out_at?: string;
  checked_out_by?: number;
  visitor_type: 'new' | 'existing';
  status: 'active' | 'checked_out' | 'deleted';
  department_name?: string;
  division_name?: string;
  public_user_name?: string;
  public_user_id_display?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateRegistryEntryData {
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

class PublicRegistryService extends ApiBase {
  // Visitor methods
  async searchVisitors(query: string): Promise<PublicVisitor[]> {
    try {
      const response = await this.makeRequest(`/public-users/search?q=${encodeURIComponent(query)}`);
      return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
      console.error('Error searching visitors:', error);
      return [];
    }
  }

  async getVisitorById(id: number): Promise<PublicVisitor | null> {
    try {
      const response = await this.makeRequest(`/public-users/${id}`);
      return response?.data || null;
    } catch (error) {
      console.error('Error getting visitor:', error);
      return null;
    }
  }

  async createVisitor(visitorData: Omit<PublicVisitor, 'id' | 'public_id' | 'created_at' | 'updated_at' | 'visit_count'>): Promise<PublicVisitor | null> {
    try {
      const response = await this.makeRequest('/public-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData)
      });
      return response?.data || null;
    } catch (error) {
      console.error('Error creating visitor:', error);
      throw error;
    }
  }

  // Registry entry methods
  async getRegistryEntries(filters: {
    date?: string;
    departmentId?: number;
    status?: string;
    visitorType?: 'new' | 'existing';
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: RegistryEntry[]; total: number }> {
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
      const response = await this.makeRequest(`/registry?${queryString}`);
      
      return {
        data: Array.isArray(response?.data) ? response.data : [],
        total: response?.meta?.total || 0
      };
    } catch (error) {
      console.error('Error getting registry entries:', error);
      return { data: [], total: 0 };
    }
  }

  async createRegistryEntry(entryData: CreateRegistryEntryData): Promise<RegistryEntry | null> {
    try {
      const response = await this.makeRequest('/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      return response?.data || null;
    } catch (error) {
      console.error('Error creating registry entry:', error);
      throw error;
    }
  }

  async checkOutVisitor(entryId: number): Promise<boolean> {
    try {
      await this.makeRequest(`/registry/${entryId}/checkout`, {
        method: 'PUT'
      });
      return true;
    } catch (error) {
      console.error('Error checking out visitor:', error);
      return false;
    }
  }

  async exportRegistryEntries(format: 'csv' | 'pdf', filters: {
    startDate: string;
    endDate: string;
    departmentId?: number;
    divisionId?: number;
  }): Promise<{ url: string } | null> {
    try {
      const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        format
      });
      
      if (filters.departmentId) params.append('department_id', filters.departmentId.toString());
      if (filters.divisionId) params.append('division_id', filters.divisionId.toString());

      const response = await this.makeRequest(`/registry/export?${params.toString()}`);
      return response?.data || null;
    } catch (error) {
      console.error('Error exporting registry entries:', error);
      throw error;
    }
  }

  // QR Code methods
  generateQRCodeUrl(publicId: string): string {
    return `/api/qr-code/${encodeURIComponent(publicId)}`;
  }

  // Helper methods
  formatVisitorName(visitor: PublicVisitor): string {
    return visitor.name || 'Unknown Visitor';
  }

  formatNic(nic: string): string {
    if (!nic) return 'N/A';
    return nic.length > 8 ? `${nic.substring(0, 5)}*****${nic.slice(-3)}` : nic;
  }
}

export const publicRegistryService = new PublicRegistryService();
