import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  QrCode, 
  Ticket, 
  Bell, 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  Users,
  FileText,
  Settings,
  UserPlus
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import IDCardGenerator from '@/components/IDCardGenerator';
import QRScanner from '@/components/QRScanner';
import TokenManagement from '@/components/TokenManagement';
import PublicAccountCreation from '@/components/PublicAccountCreation';
import NotificationManagement from '@/components/NotificationManagement';
import AppointmentManagement from '@/components/AppointmentManagement';
import NotificationBell from '@/components/NotificationBell';

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    
    if (role !== 'staff') {
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'public-accounts', label: 'Public Accounts', icon: UserPlus },
    { id: 'id-cards', label: 'ID Card Generator', icon: CreditCard },
    { id: 'qr-scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'tokens', label: 'Token Management', icon: Ticket },
    { id: 'notifications', label: 'Send Notifications', icon: Bell },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex">
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
                <h1 className="text-xl font-bold text-gray-800">DSK Staff</h1>
                <p className="text-sm text-gray-500">Staff Dashboard</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button 
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      activeTab === item.id 
                        ? 'bg-green-600 text-white' 
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
              <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <span className="text-gray-700">Welcome, {username}</span>
              <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Pending Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">24</div>
                    <p className="text-green-100">Awaiting processing</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Completed Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">18</div>
                    <p className="text-blue-100">Services completed</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">ID Cards Generated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">12</div>
                    <p className="text-purple-100">This week</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Active Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">8</div>
                    <p className="text-orange-100">In queue</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserPlus className="mr-2 text-green-600" size={20} />
                      Public Account Creation
                    </CardTitle>
                    <CardDescription>Create new public user accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setActiveTab('public-accounts')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Create Account
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="mr-2 text-blue-600" size={20} />
                      ID Card Generation
                    </CardTitle>
                    <CardDescription>Generate and print ID cards for public users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setActiveTab('id-cards')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Go to ID Cards
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Ticket className="mr-2 text-purple-600" size={20} />
                      Token Management
                    </CardTitle>
                    <CardDescription>Generate and manage service tokens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setActiveTab('tokens')}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Manage Tokens
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Your recent actions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CreditCard className="text-green-600" size={20} />
                      <div>
                        <p className="font-medium text-sm">ID card generated for Ahmed Mohamed</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <QrCode className="text-blue-600" size={20} />
                      <div>
                        <p className="font-medium text-sm">QR code scanned for service update</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Ticket className="text-purple-600" size={20} />
                      <div>
                        <p className="font-medium text-sm">Token #045 generated for Health Services</p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'public-accounts' && <PublicAccountCreation />}
          {activeTab === 'id-cards' && <IDCardGenerator />}
          {activeTab === 'qr-scanner' && <QRScanner />}
          {activeTab === 'tokens' && <TokenManagement />}
          {activeTab === 'notifications' && <NotificationManagement />}
          {activeTab === 'appointments' && <AppointmentManagement />}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Staff Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Account settings will be implemented here.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
