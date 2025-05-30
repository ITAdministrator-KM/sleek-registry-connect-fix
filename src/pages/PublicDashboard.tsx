import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, User, LogOut, Menu, X, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NotificationBell from '@/components/NotificationBell';
import ServiceHistory from '@/components/public/ServiceHistory';

const PublicDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    
    if (role !== 'public') {
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

  const services = [
    'Birth Certificate',
    'Marriage Certificate',
    'Identity Card',
    'Business License',
    'Land Certificate',
    'Educational Certificate'
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'services', label: 'Our Services', icon: CheckCircle },
    { id: 'history', label: 'Service History', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

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
                <h1 className="text-xl font-bold text-gray-800">DSK Services</h1>
                <p className="text-sm text-gray-500">Public Portal</p>
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
              <h1 className="text-2xl font-bold text-gray-800">Public Services Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <span className="text-gray-700">Welcome, {username}</span>
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome to DSK Services</CardTitle>
                  <CardDescription className="text-blue-100">
                    Access government services easily and efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-100">
                    Your one-stop portal for all Divisional Secretariat KALMUNAI services. 
                    Apply for certificates, book appointments, and track your applications.
                  </p>
                </CardContent>
              </Card>

              {/* Available Services */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <CheckCircle className="text-green-600" size={20} />
                          <span className="text-lg">{service}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">
                          Apply for your {service.toLowerCase()} online with easy document submission.
                        </p>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Apply Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Recent Applications</CardTitle>
                  <CardDescription>Track the status of your submitted applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium">Birth Certificate Application</p>
                        <p className="text-sm text-gray-500">Application #BC-2024-001</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">
                        In Progress
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Identity Card Renewal</p>
                        <p className="text-sm text-gray-500">Application #ID-2024-002</p>
                      </div>
                      <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">
                        Completed
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">Business License</p>
                        <p className="text-sm text-gray-500">Application #BL-2024-003</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">
                        Under Review
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Book an Appointment</CardTitle>
                    <CardDescription>Schedule a visit to our office</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Calendar className="mr-2" size={20} />
                      Schedule Appointment
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Support</CardTitle>
                    <CardDescription>Get help with your applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Phone: +94 67 222 3456</p>
                      <p className="text-sm text-gray-600">Email: support@dskalmunai.lk</p>
                      <p className="text-sm text-gray-600">Office Hours: 8:00 AM - 4:30 PM</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'history' && <ServiceHistory />}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Available Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="text-green-600" size={20} />
                        <span className="text-lg">{service}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Apply for your {service.toLowerCase()} online with easy document submission.
                      </p>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Apply Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>View and manage your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Profile management features will be implemented here.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PublicDashboard;
