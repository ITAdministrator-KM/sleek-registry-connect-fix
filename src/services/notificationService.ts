
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
  async getNotifications(recipientId: number, recipientType?: 'public' | 'staff'): Promise<Notification[]> {
    try {
      // Fix recipient type mapping - backend expects 'staff' for admin users
      const adjustedType = recipientType === 'admin' ? 'staff' : recipientType;
      
      let endpoint = `/notifications/index.php?recipient_id=${recipientId}`;
      if (adjustedType) endpoint += `&recipient_type=${adjustedType}`;
      
      const response = await this.makeRequest(endpoint);
      return Array.isArray(response) ? response : [];
    } catch (error) {
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
    return this.makeRequest('/notifications/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markNotificationAsRead(id: number) {
    return this.makeRequest('/notifications/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id, is_read: true }),
    });
  }
}

export const notificationService = new NotificationService();
