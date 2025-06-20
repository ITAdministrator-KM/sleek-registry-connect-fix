
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  FileText, 
  Calendar, 
  CreditCard, 
  Bell, 
  Clock,
  Menu,
  X,
  Download,
  Ticket
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PublicDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const PublicDashboardLayout: React.FC<PublicDashboardLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange 
}) => {
  const { user, logout } = useAuth(['public']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, color: 'text-blue-600' },
    { id: 'services', label: 'Book Services', icon: Ticket, color: 'text-green-600' },
    { id: 'tokens', label: 'My Tokens', icon: Clock, color: 'text-orange-600' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, color: 'text-purple-600' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'text-indigo-600' },
    { id: 'id-card', label: 'Digital ID', icon: CreditCard, color: 'text-red-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-yellow-600' },
  ];

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    logout();
  };

  const QuickActionsGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {menuItems.slice(1).map((item) => (
        <Card 
          key={item.id}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
          onClick={() => onTabChange(item.id)}
        >
          <CardContent className="p-4 text-center">
            <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
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
              <h1 className="text-xl font-bold text-gray-900">DSK Public Services</h1>
              <p className="text-sm text-gray-600">Divisional Secretariat Kalmunai</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
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
          {activeTab === 'home' && <QuickActionsGrid />}
          {children}
        </div>
      </div>
    </div>
  );
};

export default PublicDashboardLayout;
