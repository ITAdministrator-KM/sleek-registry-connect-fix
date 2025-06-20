
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
import StaffDashboardLayout from '@/components/staff/StaffDashboardLayout';
import { apiService } from '@/services/api';

const StaffDashboard = () => {
  const { user, loading, isAuthenticated, logout } = useAuth(['staff']);
  const [activeTab, setActiveTab] = useState('overview');
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

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-3">Staff Dashboard</h2>
        <p className="text-blue-100 text-lg">Manage public services efficiently</p>
        <div className="mt-4 text-blue-100 text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="h-6 w-6" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used staff tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setShowCreateUserModal(true)} 
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="mr-3" size={20} />
              Create Public Account
            </Button>
            <Button 
              onClick={() => setActiveTab('tokens')} 
              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
            >
              <Ticket className="mr-3" size={20} />
              Manage Tokens
            </Button>
            <Button 
              onClick={() => setActiveTab('public-registry')} 
              className="w-full justify-start bg-purple-600 hover:bg-purple-700"
            >
              <ClipboardList className="mr-3" size={20} />
              Visitor Registry
            </Button>
            <Button 
              onClick={() => window.open('/display', '_blank')} 
              className="w-full justify-start bg-indigo-600 hover:bg-indigo-700"
            >
              <QrCode className="mr-3" size={20} />
              Open Token Display
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6" />
              Today's Summary
            </CardTitle>
            <CardDescription>Current operations overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold">Active Tokens</p>
                <p className="text-sm text-gray-600">{stats.activeTokens} in progress</p>
              </div>
              <Badge variant="secondary">{stats.activeTokens}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">Completed</p>
                <p className="text-sm text-gray-600">{stats.servedToday} served today</p>
              </div>
              <Badge variant="secondary">{stats.servedToday}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-semibold">Waiting</p>
                <p className="text-sm text-gray-600">{stats.waitingTokens} in queue</p>
              </div>
              <Badge variant="secondary">{stats.waitingTokens}</Badge>
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
      case 'display':
        window.open('/display', '_blank');
        return renderOverviewContent();
      case 'notifications':
        return <NotificationManagement />;
      case 'settings':
        return <AccountSettings />;
      default:
        return renderOverviewContent();
    }
  };

  return (
    <StaffDashboardLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      stats={stats}
    >
      {renderContent()}
      
      {showCreateUserModal && (
        <PublicUserForm
          user={null}
          onSubmit={handleCreateUser}
          onClose={() => setShowCreateUserModal(false)}
          isLoading={false}
        />
      )}
    </StaffDashboardLayout>
  );
};

export default StaffDashboard;
