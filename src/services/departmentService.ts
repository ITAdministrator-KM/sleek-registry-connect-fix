
import { ApiBase } from './apiBase';

export interface Department {
  id: number;
  name: string;
  description?: string;
  status: string;
}

export interface Division {
  id: number;
  name: string;
  department_id: number;
  description?: string;
  status: string;
}

export class DepartmentService extends ApiBase {
  async getDepartments(): Promise<{data: Department[]}> {
    try {
      const response = await this.makeRequest('/departments/index.php');
      if (response?.status === "success" && Array.isArray(response.data)) {
        return { data: response.data.filter(dept => dept.status === 'active') };
      } else if (Array.isArray(response)) {
        return { data: response.filter(dept => dept.status === 'active') };
      }
      return { data: [] };
    } catch (error) {
      console.error('Error fetching departments:', error);
      return { data: [] };
    }
  }

  async getDivisions(departmentId: number): Promise<{data: Division[]}> {
    try {
      const response = await this.makeRequest(`/divisions/index.php?department_id=${departmentId}`);
      if (response?.status === "success" && Array.isArray(response.data)) {
        return { data: response.data.filter(div => div.status === 'active') };
      } else if (Array.isArray(response)) {
        return { data: response.filter(div => div.status === 'active') };
      }
      return { data: [] };
    } catch (error) {
      console.error('Error fetching divisions:', error);
      return { data: [] };
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
