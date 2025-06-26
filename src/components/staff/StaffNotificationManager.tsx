
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Users, User, CheckCircle, Clock, XCircle } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { apiService } from '@/services/apiService';

const StaffNotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState([]);
  const [publicUsers, setPublicUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target_type: 'individual' as 'individual' | 'all',
    target_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notifs, users] = await Promise.all([
        notificationService.getNotifications(0, 'staff'),
        apiService.getPublicUsers()
      ]);
      
      setNotifications(notifs);
      setPublicUsers(users);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    try {
      if (!newNotification.title || !newNotification.message) {
        toast({
          title: "Validation Error",
          description: "Please fill in title and message",
          variant: "destructive",
        });
        return;
      }

      const notificationData = {
        ...newNotification,
        recipient_id: newNotification.target_type === 'individual' ? parseInt(newNotification.target_id) : 0,
        recipient_type: 'public' as const
      };

      await notificationService.createNotification(notificationData);
      
      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
      
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        target_type: 'individual',
        target_id: ''
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNotificationStatus = async (id: number, status: string) => {
    try {
      // Update notification status logic here
      toast({
        title: "Success",
        description: `Notification ${status}`,
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send New Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notification title"
                value={newNotification.title}
                onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Notification message"
                value={newNotification.message}
                onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Select value={newNotification.target_type} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, target_type: value }))}>
                  <SelectTrigger id="target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="all">All Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {newNotification.target_type === 'individual' && (
              <div className="space-y-2">
                <Label htmlFor="user">Select User</Label>
                <Select value={newNotification.target_id} onValueChange={(value) => setNewNotification(prev => ({ ...prev, target_id: value }))}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {publicUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.public_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button onClick={handleSendNotification} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No notifications found</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification: any) => (
                  <div key={notification.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <Badge className={getStatusColor(notification.type)}>
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateNotificationStatus(notification.id, 'accepted')}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateNotificationStatus(notification.id, 'pending')}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateNotificationStatus(notification.id, 'rejected')}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffNotificationManager;
