
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, FileText, Bell, Ticket, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import PublicDashboardLayout from '@/components/public/PublicDashboardLayout';
import PublicServiceCatalog from '@/components/public/PublicServiceCatalog';
import DigitalTokens from '@/components/public/DigitalTokens';
import MyApplications from '@/components/public/MyApplications';
import ServiceHistory from '@/components/public/ServiceHistory';
import { PublicUserIDCard } from '@/components/PublicUserIDCard';
import { apiService } from '@/services/api';

const PublicDashboard = () => {
  const { user, loading, isAuthenticated } = useAuth(['public']);
  const [activeTab, setActiveTab] = useState('home');
  const [currentToken, setCurrentToken] = useState<any>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserData();
    }
  }, [isAuthenticated, user]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const fetchUserData = async () => {
    try {
      // Fetch user's current token, appointments, and recent activity
      // This would be implemented based on your API structure
      console.log('Fetching user data for:', user?.id);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const renderHomeContent = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-3">Welcome back, {user?.name}!</h2>
        <p className="text-blue-100 text-lg">Access government services digitally</p>
        <div className="mt-4 text-blue-100 text-sm">
          Public ID: {user?.public_id || user?.public_user_id}
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Token */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Current Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentToken ? (
              <div>
                <div className="text-2xl font-bold text-orange-600">#{currentToken.number}</div>
                <p className="text-sm text-gray-600">{currentToken.department}</p>
                <Badge className="mt-2" variant={currentToken.status === 'called' ? 'default' : 'secondary'}>
                  {currentToken.status}
                </Badge>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">No active token</p>
                <Button 
                  onClick={() => setActiveTab('services')} 
                  className="mt-2" 
                  size="sm"
                >
                  Get Token
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Appointment */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointment ? (
              <div>
                <div className="text-lg font-semibold">{upcomingAppointment.date}</div>
                <p className="text-sm text-gray-600">{upcomingAppointment.time}</p>
                <p className="text-sm text-gray-600">{upcomingAppointment.service}</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">No upcoming appointments</p>
                <Button 
                  onClick={() => setActiveTab('appointments')} 
                  className="mt-2" 
                  size="sm"
                >
                  Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.slice(0, 2).map((activity, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-gray-500">{activity.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Service Access */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => setActiveTab('services')}
            >
              <Ticket className="h-6 w-6" />
              <span className="text-xs">Get Token</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-xs">Documents</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => setActiveTab('id-card')}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-xs">Digital ID</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => setActiveTab('notifications')}
            >
              <Bell className="h-6 w-6" />
              <span className="text-xs">Notifications</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'services':
        return <PublicServiceCatalog />;
      case 'tokens':
        return <DigitalTokens />;
      case 'appointments':
        return <MyApplications />;
      case 'documents':
        return <ServiceHistory />;
      case 'id-card':
        return user ? <PublicUserIDCard user={user} /> : null;
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No new notifications</p>
            </CardContent>
          </Card>
        );
      default:
        return renderHomeContent();
    }
  };

  return (
    <PublicDashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </PublicDashboardLayout>
  );
};

export default PublicDashboard;
