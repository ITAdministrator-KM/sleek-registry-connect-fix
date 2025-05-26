
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building, FileText, Settings, LogOut, Menu, X, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import DepartmentManagement from '@/components/DepartmentManagement';
import DivisionManagement from '@/components/DivisionManagement';
import UserManagement from '@/components/UserManagement';
import AccountSettings from '@/components/AccountSettings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    
    if (user) {
      setUsername(user);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'divisions', label: 'Divisions', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12</div>
                  <p className="text-blue-100">Active departments</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total Divisions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">28</div>
                  <p className="text-green-100">Active divisions</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">156</div>
                  <p className="text-purple-100">Registered users</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Active Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">42</div>
                  <p className="text-orange-100">Staff members</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Users className="text-blue-600" size={20} />
                      <div>
                        <p className="font-medium">New user registered</p>
                        <p className="text-sm text-gray-500">John Doe - 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Building className="text-green-600" size={20} />
                      <div>
                        <p className="font-medium">Department created</p>
                        <p className="text-sm text-gray-500">Health Services - 4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <FileText className="text-purple-600" size={20} />
                      <div>
                        <p className="font-medium">Document uploaded</p>
                        <p className="text-sm text-gray-500">Policy document - 6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setActiveTab('departments')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Add New Department</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('divisions')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Add New Division</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('users')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Add New User</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'departments':
        return <DepartmentManagement />;
      case 'divisions':
        return <DivisionManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <AccountSettings />;
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-xl transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
              alt="DSK Logo" 
              className="h-10 w-10 rounded-full"
            />
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-800">DSK Admin</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {username}</span>
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
