
import { ApiBase } from './apiBase';

export interface User {
  id: number;
  user_id?: string;
  name: string;
  nic: string;
  email: string;
  username: string;
  role: string;
  department_id?: number;
  division_id?: number;
  status: string;
}

export class UserService extends ApiBase {
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.makeRequest('/users/index.php');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async createUser(data: {
    name: string;
    nic: string;
    email: string;
    username: string;
    password: string;
    role: string;
    department_id?: number | null;
    division_id?: number | null;
  }) {
    return this.makeRequest('/users/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(data: {
    id: number;
    name: string;
    nic: string;
    email: string;
    username: string;
    password?: string;
    role: string;
    department_id?: number | null;
    division_id?: number | null;
  }) {
    return this.makeRequest('/users/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.makeRequest(`/users/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }
}

export const userService = new UserService();
