
import { useState } from 'react';
import { 
  Building, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Home,
  Ticket,
  Bell,
  UserPlus,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  username: string;
}

const AdminSidebar = ({ activeTab, onTabChange, onLogout, username }: AdminSidebarProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: Home },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'divisions', label: 'Divisions', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'tokens', label: 'Token Management', icon: Ticket },
    { id: 'public-users', label: 'Public Accounts', icon: UserPlus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-xl transition-all duration-300 flex flex-col border-r border-gray-200`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
            alt="DSK Logo" 
            className="h-10 w-10 rounded-full shadow-md"
          />
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold text-gray-800">DSK Admin</h1>
              <p className="text-sm text-gray-500">Administrative Panel</p>
            </div>
          )}
        </div>
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-center hover:bg-gray-50 transition-colors"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <IconComponent size={20} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        {sidebarOpen && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Logged in as:</p>
            <p className="font-medium text-gray-800">{username}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
