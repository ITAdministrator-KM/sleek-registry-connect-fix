import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, Ticket } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import DepartmentManagement from '@/components/DepartmentManagement';
import DivisionManagement from '@/components/DivisionManagement';
import UserManagement from '@/components/UserManagement';
import AccountSettings from '@/components/AccountSettings';
import TokenManagement from '@/components/TokenManagement';
import NotificationManagement from '@/components/NotificationManagement';
import PublicAccountCreation from '@/components/PublicAccountCreation';
import DashboardStats from '@/components/DashboardStats';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('Checking admin authentication...');
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    const token = localStorage.getItem('authToken');
    
    console.log('Auth state:', { role, user, hasToken: !!token });
    
    // Strict role and token validation
    if (role !== 'admin' || !token) {
      console.log('Invalid admin session, redirecting to login');
      localStorage.clear(); // Clear any invalid session data
      navigate('/login');
      return;
    }
    
    if (user) {
      console.log('Setting admin username:', user);
      setUsername(user);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userDepartmentId');
    localStorage.removeItem('userDivisionId');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview' },
    { id: 'departments', label: 'Departments' },
    { id: 'divisions', label: 'Divisions' },
    { id: 'users', label: 'User Management' },
    { id: 'tokens', label: 'Token Management' },
    { id: 'public-users', label: 'Public Accounts' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'settings', label: 'Account Settings' },
  ];

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">Overview of system statistics and activities</p>
      </div>
      
      <DashboardStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <CardTitle className="text-blue-800">Recent Activities</CardTitle>
            <CardDescription className="text-blue-600">Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">New department created</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Staff user added</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Token system updated</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
            <CardTitle className="text-green-800">Quick Actions</CardTitle>
            <CardDescription className="text-green-600">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <Button 
              onClick={() => setActiveTab('departments')} 
              className="w-full justify-start bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-all duration-200"
              variant="default"
            >
              <Building className="mr-2" size={16} />
              Manage Departments
            </Button>
            <Button 
              onClick={() => setActiveTab('users')} 
              className="w-full justify-start bg-green-500 hover:bg-green-600 text-white shadow-md transition-all duration-200"
              variant="default"
            >
              <Users className="mr-2" size={16} />
              Add New User
            </Button>
            <Button 
              onClick={() => setActiveTab('tokens')} 
              className="w-full justify-start bg-purple-500 hover:bg-purple-600 text-white shadow-md transition-all duration-200"
              variant="default"
            >
              <Ticket className="mr-2" size={16} />
              Token Management
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'departments':
        return <DepartmentManagement />;
      case 'divisions':
        return <DivisionManagement />;
      case 'users':
        return <UserManagement />;
      case 'tokens':
        return <TokenManagement />;
      case 'public-users':
        return <PublicAccountCreation />;
      case 'notifications':
        return <NotificationManagement />;
      case 'settings':
        return <AccountSettings />;
      default:
        return renderOverviewContent();
    }
  };

  const getCurrentTitle = () => {
    const currentMenu = menuItems.find(item => item.id === activeTab);
    return currentMenu?.label || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      <AdminSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        username={username}
      />

      <div className="flex-1 flex flex-col">
        <AdminHeader 
          title={getCurrentTitle()}
          username={username}
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
