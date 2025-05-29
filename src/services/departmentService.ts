
import { ApiBase } from './apiBase';

export interface Department {
  id: number;
  name: string;
  description?: string;
  status: string;
}

export class DepartmentService extends ApiBase {  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.makeRequest('/departments/index.php');
      if (response?.status === "success" && Array.isArray(response.data)) {
        return response.data.filter(dept => dept.status === 'active');
      } else if (Array.isArray(response)) {
        return response.filter(dept => dept.status === 'active');
      }
      return [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async createDepartment(data: { name: string; description?: string }) {
    return this.makeRequest('/departments/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(data: { id: number; name: string; description?: string }) {
    return this.makeRequest('/departments/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: number) {
    return this.makeRequest(`/departments/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }
}

export const departmentService = new DepartmentService();
