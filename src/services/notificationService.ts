
import { ApiBase } from './apiBase';

export interface Notification {
  id: number;
  recipient_id: number;
  recipient_type: 'public' | 'staff';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export class NotificationService extends ApiBase {
  async getNotifications(recipientId: number, recipientType?: 'public' | 'staff' | 'admin'): Promise<Notification[]> {
    try {
      // Map 'admin' to 'staff' for backend compatibility
      const backendType = recipientType === 'admin' ? 'staff' : recipientType;
      
      let endpoint = `/notifications/index.php?recipient_id=${recipientId}`;
      if (backendType) endpoint += `&recipient_type=${backendType}`;
      
      const response = await this.makeRequest(endpoint);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      // If the error is 404, the notifications endpoint doesn't exist yet
      if (error.message.includes('404')) {
        console.warn('Notifications endpoint not found. This feature may not be implemented yet.');
        return [];
      }
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async createNotification(data: {
    recipient_id: number;
    recipient_type?: 'public' | 'staff';
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }) {
    try {
      return await this.makeRequest('/notifications/index.php', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      // If the error is 404, the notifications endpoint doesn't exist yet
      if (error.message.includes('404')) {
        console.warn('Notifications endpoint not found. This feature may not be implemented yet.');
        return { success: false, message: 'Notifications feature not available' };
      }
      throw error;
    }
  }

  async markNotificationAsRead(id: number) {
    try {
      return await this.makeRequest('/notifications/index.php', {
        method: 'PUT',
        body: JSON.stringify({ id, is_read: true }),
      });
    } catch (error) {
      // If the error is 404, the notifications endpoint doesn't exist yet
      if (error.message.includes('404')) {
        console.warn('Notifications endpoint not found. This feature may not be implemented yet.');
        return { success: false, message: 'Notifications feature not available' };
      }
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
