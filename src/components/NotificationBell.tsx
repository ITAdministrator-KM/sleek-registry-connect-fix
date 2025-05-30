import { useState, useEffect } from 'react';
import { Bell, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService, NotificationData, NotificationsResponse } from '@/services/api';
import { useToast } from "@/hooks/use-toast";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getNotifications();
      if (response.status === 'success') {
        setNotifications(response.data || []);
        setUnreadCount(response.meta?.unread || 0);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Could not load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      setIsLoading(true);
      await apiService.markNotificationAsRead(notificationId);
      await fetchNotifications();
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    fetchNotifications();
    toast({
      description: "Refreshing notifications...",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-blue-50 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={20} className="text-gray-600 animate-spin" />
          ) : (
            <Bell size={20} className="text-gray-600" />
          )}
          {unreadCount > 0 && !isLoading && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Notifications</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                {notifications.length}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="hover:bg-gray-100"
              >
                <RefreshCw size={16} className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto space-y-2">
            {error ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchNotifications}
                  className="text-xs"
                >
                  Try Again
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No notifications yet
              </p>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    !notification.is_read ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-gray-100'
                  }`}
                  onClick={() => !notification.is_read && !isLoading && markAsRead(notification.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <span>{getNotificationIcon(notification.type)}</span>
                      <span className="text-gray-800">{notification.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs text-gray-600">
                      {notification.message}
                    </CardDescription>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
