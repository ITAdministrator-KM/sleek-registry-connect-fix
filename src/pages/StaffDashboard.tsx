
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Ticket, Clock, CheckCircle, AlertCircle, Settings, UserPlus, QrCode, CreditCard, Scan } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import TokenManagement from '@/components/TokenManagement';
import { PublicAccountsManagement } from '@/components/PublicAccountsManagement';
import AccountSettings from '@/components/AccountSettings';
import { PublicUserForm } from '@/components/public-accounts/PublicUserForm';
import IDCardGenerator from '@/components/IDCardGenerator';
import QRScanner from '@/components/QRScanner';
import { apiService } from '@/services/api';

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [username, setUsername] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showIDCardGenerator, setShowIDCardGenerator] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [stats, setStats] = useState({
    activeTokens: 0,
    servedToday: 0,
    waitingTokens: 0,
    publicUsers: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();  useEffect(() => {
    // Get all required data
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    const token = localStorage.getItem('authToken');
    const department = localStorage.getItem('userDepartmentName');
    
    console.log('Staff Dashboard - Auth Check:', {
      role: role,
      user: user,
      hasToken: !!token,
      department: department
    });

    // Check if user is authenticated
    if (!token) {
      console.log('No auth token found, redirecting to login');
      navigate('/login');
      return;
    }

    // Check if user has staff access (case-insensitive)
    if (!role || role.toLowerCase() !== 'staff') {
      console.log('Access denied: Invalid role:', role);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the staff dashboard.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
    
    if (user) {
      setUsername(user);
      setUserDepartment(department || 'General Services');
    }
    
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const [tokens, publicUsers] = await Promise.all([
        apiService.getTokens(),
        apiService.getPublicUsers()
      ]);
      
      const activeTokens = tokens.filter(t => t.status === 'waiting' || t.status === 'called').length;
      const waitingTokens = tokens.filter(t => t.status === 'waiting').length;
      const servedToday = tokens.filter(t => t.status === 'completed').length;
      
      setStats({
        activeTokens,
        servedToday,
        waitingTokens,
        publicUsers: publicUsers.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await apiService.createPublicUser(userData);
      setShowCreateUserModal(false);
      fetchStats(); // Refresh stats
      toast({
        title: "Success",
        description: "Public user created successfully with QR code",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create public user",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: Clock },
    { id: 'tokens', label: 'Token Management', icon: Ticket },
    { id: 'public-accounts', label: 'Public Accounts', icon: Users },
    { id: 'id-cards', label: 'ID Card Generator', icon: CreditCard },
    { id: 'qr-scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  const renderOverviewContent = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-3">Staff Dashboard</h2>
        <p className="text-emerald-100 text-lg">Welcome back, {username}!</p>
        <p className="text-emerald-200 text-sm">{userDepartment}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-800">{stats.activeTokens}</p>
                <p className="text-blue-600 text-sm font-medium">Active Tokens</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-800">{stats.servedToday}</p>
                <p className="text-green-600 text-sm font-medium">Served Today</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-800">{stats.waitingTokens}</p>
                <p className="text-yellow-600 text-sm font-medium">Waiting</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-800">{stats.publicUsers}</p>
                <p className="text-purple-600 text-sm font-medium">Public Users</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardHeader>
            <CardTitle className="text-indigo-800 flex items-center gap-3">
              <Settings className="h-6 w-6" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-indigo-600">Staff management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setShowCreateUserModal(true)} 
              className="w-full justify-start bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <UserPlus className="mr-3" size={20} />
              Create Public Account
            </Button>
            <Button 
              onClick={() => setActiveTab('tokens')} 
              className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <Ticket className="mr-3" size={20} />
              Manage Tokens
            </Button>
            <Button 
              onClick={() => setActiveTab('id-cards')} 
              className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <CreditCard className="mr-3" size={20} />
              Generate ID Cards
            </Button>
            <Button 
              onClick={() => setActiveTab('qr-scanner')} 
              className="w-full justify-start bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <Scan className="mr-3" size={20} />
              Scan QR Code
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-3">
              <AlertCircle className="h-6 w-6" />
              Today's Queue
            </CardTitle>
            <CardDescription className="text-slate-600">Current token status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                <div>
                  <p className="font-semibold text-gray-800">Token #A001</p>
                  <p className="text-sm text-gray-600">General Services</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Serving</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
                <div>
                  <p className="font-semibold text-gray-800">Token #A002</p>
                  <p className="text-sm text-gray-600">Document Services</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Waiting</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-l-4 border-green-400">
                <div>
                  <p className="font-semibold text-gray-800">Token #A003</p>
                  <p className="text-sm text-gray-600">Certificate Services</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Completed</span>
              </div>
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
      case 'tokens':
        return <TokenManagement />;
      case 'public-accounts':
        return <PublicAccountsManagement />;
      case 'id-cards':
        return <IDCardGenerator />;
      case 'qr-scanner':
        return <QRScanner />;
      case 'settings':
        return <AccountSettings />;
      default:
        return renderOverviewContent();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-100">
      <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-emerald-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              DSK Staff Portal
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Welcome, {username}</span>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white/80 backdrop-blur-sm shadow-lg min-h-screen border-r border-emerald-200">
          <div className="p-6">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {showCreateUserModal && (
        <PublicUserForm
          user={null}
          onSubmit={handleCreateUser}
          onClose={() => setShowCreateUserModal(false)}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
