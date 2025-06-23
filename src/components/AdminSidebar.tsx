import React from 'react';
import {
  BarChart3,
  Users,
  UserPlus,
  Building,
  GitBranch,
  BookOpen,
  ClipboardList,
  Hash,
  Calendar,
  Folder,
  Bell,
  Settings
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'public-accounts', label: 'Public Accounts', icon: UserPlus },
    { id: 'departments', label: 'Department Management', icon: Building },
    { id: 'divisions', label: 'Division Management', icon: GitBranch },
    { id: 'subject-management', label: 'Subject Management', icon: BookOpen },
    { id: 'public-registry', label: 'Public Registry', icon: ClipboardList },
    { id: 'tokens', label: 'Token Management', icon: Hash },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'service-catalog', label: 'Service Catalog', icon: Folder },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Account Settings', icon: Settings }
  ];

  return (
    <div className="fixed left-0 top-16 h-full w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Administration</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
