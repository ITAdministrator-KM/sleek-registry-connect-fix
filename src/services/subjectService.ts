
import { ApiBase } from './apiBase';

export interface SubjectStaff {
  id: number;
  user_id: number;
  post: string;
  assigned_department_id: number;
  assigned_division_id: number;
  department_name?: string;
  division_name?: string;
  status: string;
}

export interface Document {
  id: number;
  document_name: string;
  document_type: 'word' | 'excel';
  file_name: string;
  file_path: string;
  department_id: number;
  division_id: number;
  description?: string;
  is_active: string;
}

export class SubjectService extends ApiBase {
  async getSubjectStaffData(userId: number): Promise<{data: SubjectStaff}> {
    return this.makeRequest(`/subject-staff/index.php?user_id=${userId}`);
  }

  async getDocuments(departmentId: number, divisionId: number): Promise<{data: Document[]}> {
    return this.makeRequest(`/documents/index.php?department_id=${departmentId}&division_id=${divisionId}`);
  }

  async downloadDocument(documentId: number): Promise<void> {
    const response = await this.makeRequest(`/documents/download.php?id=${documentId}`, {
      method: 'GET',
    });
    
    // Handle file download
    const blob = new Blob([response], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${documentId}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async saveExcelDocument(documentId: number, data: any): Promise<any> {
    return this.makeRequest('/documents/save-excel.php', {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        data: data
      }),
    });
  }

  async downloadExcelDocument(documentId: number): Promise<void> {
    return this.downloadDocument(documentId);
  }

  async createSubjectStaff(data: {
    user_id: number;
    post: string;
    assigned_department_id: number;
    assigned_division_id: number;
  }): Promise<any> {
    return this.makeRequest('/subject-staff/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubjectStaff(id: number, data: Partial<SubjectStaff>): Promise<any> {
    return this.makeRequest('/subject-staff/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });
  }

  async deleteSubjectStaff(id: number): Promise<any> {
    return this.makeRequest(`/subject-staff/index.php?id=${id}`, {
      method: 'DELETE',
    });
  }
}

export const subjectService = new SubjectService();
