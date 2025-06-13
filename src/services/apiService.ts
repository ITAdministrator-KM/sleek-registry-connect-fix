
const API_BASE_URL = 'https://dskalmunai.lk/backend/api';

class ApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed:`, error);
      throw error;
    }
  }

  // Service Catalog
  async getServices() {
    return this.makeRequest('/service-catalog/');
  }

  async getPublicServices() {
    return this.makeRequest('/service-catalog/?public=true');
  }

  async createService(serviceData: any) {
    return this.makeRequest('/service-catalog/', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: number, serviceData: any) {
    return this.makeRequest(`/service-catalog/?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(id: number) {
    return this.makeRequest(`/service-catalog/?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Departments
  async getDepartments() {
    return this.makeRequest('/departments/');
  }

  // Divisions
  async getDivisions(departmentId?: number) {
    const query = departmentId ? `?department_id=${departmentId}` : '';
    return this.makeRequest(`/divisions/${query}`);
  }

  // Document Upload
  async uploadDocument(file: File, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  }
}

export const apiService = new ApiService();
