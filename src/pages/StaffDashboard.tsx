import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Ticket, Clock, CheckCircle, AlertCircle, Settings, UserPlus, QrCode, CreditCard, Scan, Bell, Loader2, ClipboardList } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import TokenManagement from '@/components/TokenManagement';
import { PublicAccountsManagement } from '@/components/PublicAccountsManagement';
import AccountSettings from '@/components/AccountSettings';
import { PublicUserForm } from '@/components/public-accounts/PublicUserForm';
import IDCardGenerator from '@/components/IDCardGenerator';
import ResponsiveQRScanner from '@/components/ResponsiveQRScanner';
import NotificationManagement from '@/components/NotificationManagement';
import PublicRegistry from '@/components/staff/PublicRegistry';
import { apiService } from '@/services/api';

const StaffDashboard = () => {
  const { user, loading, isAuthenticated, logout } = useAuth(['staff']); // Allow only staff
  const [activeTab, setActiveTab] = useState('overview');
  const [username, setUsername] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [stats, setStats] = useState({
    activeTokens: 0,
    servedToday: 0,
    waitingTokens: 0,
    publicUsers: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle authentication and redirects
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
  }, [loading, isAuthenticated, navigate]);

  // Set user info when authenticated
  useEffect(() => {
    if (user) {
      setUsername(user.name || user.username || '');
      setUserDepartment(user.department_name || 'General Services');
    }
  }, [user]);

  // Fetch stats when component mounts and user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadData = async () => {
      try {
        await fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadData();
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const fetchStats = async () => {
    try {
      const [tokens, publicUsers] = await Promise.all([
        apiService.getTokens(),
        apiService.getPublicUsers()
      ]);
      
      const today = new Date().toDateString();
      const todayTokens = tokens.filter(t => new Date(t.created_at).toDateString() === today);
      
      const activeTokens = todayTokens.filter(t => t.status === 'waiting' || t.status === 'called' || t.status === 'serving').length;
      const waitingTokens = todayTokens.filter(t => t.status === 'waiting').length;
      const servedToday = todayTokens.filter(t => t.status === 'completed').length;
      
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
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    logout();
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const result = await apiService.createPublicUser(userData);
      setShowCreateUserModal(false);
      fetchStats();
      toast({
        title: "Success",
        description: `Public user created successfully with ID: ${result.public_id}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create public user",
        variant: "destructive",
      });
    }
  };

  const handleQRScanSuccess = (result: string) => {
    try {
      const qrData = JSON.parse(result);
      if (qrData.public_id) {
        toast({
          title: "QR Code Scanned",
          description: `Public ID: ${qrData.public_id}`,
        });
        // Handle the scanned data as needed
      } else {
        toast({
          title: "Invalid QR Code",
          description: "QR code does not contain valid public ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Please scan a valid Public ID QR code",
        variant: "destructive",
      });
    }
  };

  const handleQRScanError = (error: any) => {
    console.error('QR Scan error:', error);
    toast({
      title: "Scan Error",
      description: "Failed to scan QR code",
      variant: "destructive",
    });
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: Clock },
    { id: 'tokens', label: 'Token Management', icon: Ticket },
    { id: 'public-accounts', label: 'Public Accounts', icon: Users },
    { id: 'public-registry', label: 'Public Registry', icon: ClipboardList },
    { id: 'id-cards', label: 'ID Card Generator', icon: CreditCard },
    { id: 'qr-scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  const renderOverviewContent = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-3">Staff Dashboard</h2>
        <p className="text-emerald-100 text-lg">Welcome back, {username}!</p>
        <p className="text-emerald-200 text-sm">{userDepartment}</p>
        <div className="mt-4 text-emerald-100 text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
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
              👤 Create Public Account
            </Button>
            <Button 
              onClick={() => setActiveTab('tokens')} 
              className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <Ticket className="mr-3" size={20} />
              🎫 Manage Tokens
            </Button>
            <Button 
              onClick={() => setActiveTab('id-cards')} 
              className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <CreditCard className="mr-3" size={20} />
              📇 Generate ID Cards
            </Button>
            <Button 
              onClick={() => setActiveTab('qr-scanner')} 
              className="w-full justify-start bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <Scan className="mr-3" size={20} />
              📱 Responsive QR Scanner
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-3">
              <AlertCircle className="h-6 w-6" />
              Today's Activity
            </CardTitle>
            <CardDescription className="text-slate-600">Current operations summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                <div>
                  <p className="font-semibold text-gray-800">Active Queue</p>
                  <p className="text-sm text-gray-600">{stats.activeTokens} tokens in progress</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Live</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
                <div>
                  <p className="font-semibold text-gray-800">Waiting</p>
                  <p className="text-sm text-gray-600">{stats.waitingTokens} tokens waiting</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Queue</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-l-4 border-green-400">
                <div>
                  <p className="font-semibold text-gray-800">Completed</p>
                  <p className="text-sm text-gray-600">{stats.servedToday} services completed today</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Done</span>
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
      case 'public-registry':
        return <PublicRegistry />;
      case 'id-cards':
        return <IDCardGenerator />;
      case 'qr-scanner':
        return <ResponsiveQRScanner onScanSuccess={handleQRScanSuccess} onError={handleQRScanError} />;
      case 'notifications':
        return <NotificationManagement />;
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
              📱 DSK Staff Portal
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
