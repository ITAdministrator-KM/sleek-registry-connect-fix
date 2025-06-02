
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, FileText, Calendar, Ticket, Clock, LogOut, Settings, History, Home, Service } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { PublicAccountsManagement } from '@/components/PublicAccountsManagement';
import ServiceRequest from '@/components/public/ServiceRequest';
import MyApplications from '@/components/public/MyApplications';
import DigitalTokens from '@/components/public/DigitalTokens';
import ServiceHistory from '@/components/public/ServiceHistory';
import IDCardGenerator from '@/components/IDCardGenerator';

const PublicDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [username, setUsername] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('Checking public user authentication...');
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    const token = localStorage.getItem('authToken');
    
    console.log('Auth state:', { role, user, hasToken: !!token });
    
    if (role !== 'public' || !token) {
      console.log('Invalid public session, redirecting to login');
      localStorage.clear();
      navigate('/login');
      return;
    }
    
    if (user) {
      console.log('Setting public username:', user);
      setUsername(user);
      // Load additional user info from localStorage
      const fullName = localStorage.getItem('userFullName');
      const userId = localStorage.getItem('userId');
      setUserInfo({ username: user, fullName, userId });
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

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'services', label: 'Available Services', icon: Service },
    { id: 'applications', label: 'My Applications', icon: FileText },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'tokens', label: 'Digital Tokens', icon: Ticket },
    { id: 'history', label: 'Service History', icon: History },
    { id: 'id-card', label: 'My ID Card', icon: User },
    { id: 'profile', label: 'Profile Settings', icon: Settings },
  ];

  const handleServiceRequested = () => {
    // Refresh the applications and tokens when a service is requested
    if (activeTab === 'applications') {
      window.location.reload();
    }
    setActiveTab('applications');
    toast({
      title: "Service Requested",
      description: "Your service request has been submitted successfully!",
    });
  };

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {userInfo?.fullName || username}!</h1>
        <p className="text-blue-100">Access government services efficiently through our digital platform</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('services')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Available</p>
                <p className="text-2xl font-bold text-green-800">12</p>
                <p className="text-green-600 text-sm">Services</p>
              </div>
              <Service className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('applications')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">My</p>
                <p className="text-2xl font-bold text-blue-800">3</p>
                <p className="text-blue-600 text-sm">Applications</p>
              </div>
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('appointments')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Upcoming</p>
                <p className="text-2xl font-bold text-purple-800">1</p>
                <p className="text-purple-600 text-sm">Appointment</p>
              </div>
              <Calendar className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('tokens')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-orange-800">1</p>
                <p className="text-orange-600 text-sm">Token</p>
              </div>
              <Ticket className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <CardTitle className="text-blue-800">Quick Actions</CardTitle>
            <CardDescription className="text-blue-600">Common services and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <Button 
              onClick={() => setActiveTab('services')} 
              className="w-full justify-start bg-green-500 hover:bg-green-600 text-white"
            >
              <Service className="mr-2" size={16} />
              Request New Service
            </Button>
            <Button 
              onClick={() => setActiveTab('applications')} 
              className="w-full justify-start bg-blue-500 hover:bg-blue-600 text-white"
            >
              <FileText className="mr-2" size={16} />
              View My Applications
            </Button>
            <Button 
              onClick={() => setActiveTab('appointments')} 
              className="w-full justify-start bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Calendar className="mr-2" size={16} />
              Book Appointment
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
            <CardTitle className="text-green-800">Recent Activity</CardTitle>
            <CardDescription className="text-green-600">Your latest interactions with our services</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Birth Certificate request submitted</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Token #45 called for service</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Appointment scheduled</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
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
      case 'services':
        return <ServiceRequest onServiceRequested={handleServiceRequested} />;
      case 'applications':
        return <MyApplications />;
      case 'appointments':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>Manage your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Appointment management feature coming soon...</p>
            </CardContent>
          </Card>
        );
      case 'tokens':
        return <DigitalTokens />;
      case 'history':
        return <ServiceHistory />;
      case 'id-card':
        return <IDCardGenerator />;
      case 'profile':
        return <PublicAccountsManagement />;
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
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r">
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-white">
              <h2 className="font-semibold">DSK Public</h2>
              <p className="text-sm text-blue-100">{username}</p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t">
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{getCurrentTitle()}</h1>
              <p className="text-gray-600">Divisional Secretariat Kalmunai - Public Portal</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{username}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PublicDashboard;
