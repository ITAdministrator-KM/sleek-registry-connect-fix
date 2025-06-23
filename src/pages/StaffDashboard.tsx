
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import TokenManagement from '@/components/TokenManagement';
import { PublicAccountsManagement } from '@/components/PublicAccountsManagement';
import AccountSettings from '@/components/AccountSettings';
import { PublicUserForm } from '@/components/public-accounts/PublicUserForm';
import IDCardGenerator from '@/components/IDCardGenerator';
import NotificationManagement from '@/components/NotificationManagement';
import PublicRegistry from '@/components/staff/PublicRegistry';
import StaffDashboardLayout from '@/components/staff/StaffDashboardLayout';
import TokenDisplayLauncher from '@/components/display/TokenDisplayLauncher';
import StaffOverview from '@/components/staff/StaffOverview';
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StaffOverview onCreateUser={() => setShowCreateUserModal(true)} onTabChange={setActiveTab} stats={stats} />;
      case 'tokens':
        return <TokenManagement />;
      case 'public-accounts':
        return <PublicAccountsManagement />;
      case 'public-registry':
        return <PublicRegistry />;
      case 'id-cards':
        return <IDCardGenerator />;
      case 'display':
        return <TokenDisplayLauncher />;
      case 'notifications':
        return <NotificationManagement />;
      case 'settings':
        return <AccountSettings />;
      default:
        return <StaffOverview onCreateUser={() => setShowCreateUserModal(true)} onTabChange={setActiveTab} stats={stats} />;
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
