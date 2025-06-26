
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Users, 
  IdCard, 
  Ticket, 
  Monitor, 
  Bell, 
  Settings, 
  LogOut,
  UserPlus,
  QrCode,
  History
} from 'lucide-react';

interface StaffDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: {
    activeTokens: number;
    servedToday: number;
    waitingTokens: number;
    publicUsers: number;
  };
}

const StaffDashboardLayout: React.FC<StaffDashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  stats
}) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'public-registry', label: 'Public Registry', icon: UserPlus },
    { id: 'tokens', label: 'Token Management', icon: Ticket, badge: stats.activeTokens },
    { id: 'public-accounts', label: 'Public Accounts', icon: Users, badge: stats.publicUsers },
    { id: 'id-cards', label: 'ID Cards', icon: IdCard },
    { id: 'token-display', label: 'Token Display', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display Launch', icon: QrCode },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">DS</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Staff Dashboard</h2>
              <p className="text-sm text-gray-600">DSK System</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t bg-white">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs">{user?.role}</div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardLayout;
