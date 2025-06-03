
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, Ticket, Activity, Shield, Database } from 'lucide-react';
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
    
    if (role !== 'admin' || !token) {
      console.log('Invalid admin session, redirecting to login');
      localStorage.clear();
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
    { id: 'overview', label: 'Dashboard Overview', icon: Activity },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'divisions', label: 'Divisions', icon: Database },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'tokens', label: 'Token Management', icon: Ticket },
    { id: 'public-users', label: 'Public Accounts', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Activity },
    { id: 'settings', label: 'Account Settings', icon: Shield },
  ];

  const renderOverviewContent = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-3">Admin Dashboard</h2>
        <p className="text-blue-100 text-lg">Welcome back! Here's your system overview</p>
      </div>
      
      <DashboardStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-l-blue-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-blue-800 flex items-center gap-3">
              <Activity className="h-6 w-6" />
              Recent Activities
            </CardTitle>
            <CardDescription className="text-blue-600">Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border-l-4 border-blue-400">
              <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-gray-800">New department created</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border-l-4 border-green-400">
              <div className="h-3 w-3 bg-green-600 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Staff user added</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border-l-4 border-yellow-400">
              <div className="h-3 w-3 bg-yellow-600 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Token system updated</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-100 border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-green-800 flex items-center gap-3">
              <Shield className="h-6 w-6" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-green-600">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setActiveTab('departments')} 
              className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
              variant="default"
            >
              <Building className="mr-3" size={20} />
              Manage Departments
            </Button>
            <Button 
              onClick={() => setActiveTab('users')} 
              className="w-full justify-start bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
              variant="default"
            >
              <Users className="mr-3" size={20} />
              Add New User
            </Button>
            <Button 
              onClick={() => setActiveTab('tokens')} 
              className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
              variant="default"
            >
              <Ticket className="mr-3" size={20} />
              Token Management
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-100 border-l-4 border-l-purple-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-purple-800 flex items-center gap-3">
              <Database className="h-6 w-6" />
              System Health
            </CardTitle>
            <CardDescription className="text-purple-600">Current system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <span className="text-sm font-medium text-gray-700">Database Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <span className="text-sm font-medium text-gray-700">API Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <span className="text-sm font-medium text-gray-700">Active Sessions</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">24</span>
            </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex">
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

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
