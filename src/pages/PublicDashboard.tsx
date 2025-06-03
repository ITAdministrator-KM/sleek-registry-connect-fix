
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, User, Bell, CreditCard, MapPin, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import DigitalTokens from '@/components/public/DigitalTokens';
import ServiceRequest from '@/components/public/ServiceRequest';
import MyApplications from '@/components/public/MyApplications';
import ServiceHistory from '@/components/public/ServiceHistory';
import { ProfileSettings } from '@/components/public-accounts/ProfileSettings';

const PublicDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [username, setUsername] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    const fullName = localStorage.getItem('userFullName') || user;
    const token = localStorage.getItem('authToken');
    
    if (role !== 'public' || !token) {
      localStorage.clear();
      navigate('/login');
      return;
    }
    
    if (user) {
      setUsername(user);
      setUserFullName(fullName);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const handleServiceRequested = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Service Requested",
      description: "Your service request has been submitted successfully.",
    });
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: User },
    { id: 'tokens', label: 'Digital Tokens', icon: CreditCard },
    { id: 'services', label: 'Request Service', icon: FileText },
    { id: 'applications', label: 'My Applications', icon: Clock },
    { id: 'history', label: 'Service History', icon: Bell },
    { id: 'profile', label: 'Profile Settings', icon: Settings },
  ];

  const renderOverviewContent = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-3">Welcome to DSK Portal</h2>
        <p className="text-indigo-100 text-lg">Hello, {userFullName}!</p>
        <p className="text-indigo-200 text-sm">Access government services digitally</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-800">3</p>
                <p className="text-blue-600 text-sm font-medium">Active Tokens</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-800">7</p>
                <p className="text-green-600 text-sm font-medium">Completed</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-800">2</p>
                <p className="text-yellow-600 text-sm font-medium">Pending</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-800">1</p>
                <p className="text-purple-600 text-sm font-medium">Notifications</p>
              </div>
              <Bell className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-3">
              <MapPin className="h-6 w-6" />
              Quick Services
            </CardTitle>
            <CardDescription className="text-slate-600">Access popular government services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setActiveTab('tokens')} 
              className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <CreditCard className="mr-3" size={20} />
              Get Digital Token
            </Button>
            <Button 
              onClick={() => setActiveTab('services')} 
              className="w-full justify-start bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <FileText className="mr-3" size={20} />
              Request Certificate
            </Button>
            <Button 
              onClick={() => setActiveTab('applications')} 
              className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 rounded-xl h-12"
            >
              <Clock className="mr-3" size={20} />
              Track Applications
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardHeader>
            <CardTitle className="text-indigo-800 flex items-center gap-3">
              <Bell className="h-6 w-6" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-indigo-600">Your latest service interactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                <div>
                  <p className="font-semibold text-gray-800">Birth Certificate</p>
                  <p className="text-sm text-gray-600">Application submitted</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Processing</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-l-4 border-green-400">
                <div>
                  <p className="font-semibold text-gray-800">Police Report</p>
                  <p className="text-sm text-gray-600">Ready for collection</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Ready</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
                <div>
                  <p className="font-semibold text-gray-800">Business License</p>
                  <p className="text-sm text-gray-600">Under review</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Review</span>
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
        return <DigitalTokens />;
      case 'services':
        return <ServiceRequest onServiceRequested={handleServiceRequested} />;
      case 'applications':
        return <MyApplications />;
      case 'history':
        return <ServiceHistory />;
      case 'profile':
        return <ProfileSettings user={{}} />;
      default:
        return renderOverviewContent();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-100">
      <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-indigo-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              DSK Public Portal
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Welcome, {userFullName}</span>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white/80 backdrop-blur-sm shadow-lg min-h-screen border-r border-indigo-200">
          <div className="p-6">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
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
    </div>
  );
};

export default PublicDashboard;
