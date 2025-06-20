
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  CreditCard, 
  QrCode, 
  ClipboardList, 
  Tv, 
  Settings,
  Bell,
  Home,
  Menu,
  X
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface StaffDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats?: {
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
  stats = { activeTokens: 0, servedToday: 0, waitingTokens: 0, publicUsers: 0 }
}) => {
  const { user, logout } = useAuth(['staff']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: Home, color: 'text-blue-600' },
    { id: 'public-accounts', label: 'Public Accounts', icon: Users, color: 'text-green-600' },
    { id: 'public-registry', label: 'Visitor Registry', icon: ClipboardList, color: 'text-purple-600' },
    { id: 'id-cards', label: 'ID Cards', icon: CreditCard, color: 'text-orange-600' },
    { id: 'tokens', label: 'Token Management', icon: QrCode, color: 'text-red-600' },
    { id: 'display', label: 'Token Display', icon: Tv, color: 'text-indigo-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-yellow-600' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' },
  ];

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    logout();
  };

  const QuickStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.activeTokens}</p>
              <p className="text-sm text-gray-600">Active Tokens</p>
            </div>
            <QrCode className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.servedToday}</p>
              <p className="text-sm text-gray-600">Served Today</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.waitingTokens}</p>
              <p className="text-sm text-gray-600">Waiting</p>
            </div>
            <ClipboardList className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.publicUsers}</p>
              <p className="text-sm text-gray-600">Public Users</p>
            </div>
            <UserPlus className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DSK Staff Portal</h1>
              <p className="text-sm text-gray-600">{user?.department_name} - {user?.division_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-green-600 border-green-600">
              Welcome, {user?.name}
            </Badge>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-0
        `}>
          <div className="p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} className={activeTab === item.id ? 'text-blue-600' : item.color} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 p-6">
          {activeTab === 'overview' && <QuickStatsCards />}
          {children}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardLayout;
