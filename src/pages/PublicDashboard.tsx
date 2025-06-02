
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Calendar, 
  User, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Download,
  Clock,
  CheckCircle,
  Users,
  Building,
  CreditCard,
  Shield,
  BookOpen,
  Heart,
  Briefcase,
  Home,
  Ticket
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ProfileSettings } from '@/components/public-accounts/ProfileSettings';
import { ServiceHistory } from '@/components/public/ServiceHistory';
import NotificationBell from '@/components/NotificationBell';
import { apiService, type PublicUser } from '@/services/api';

const PublicDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [userInfo, setUserInfo] = useState<PublicUser | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    applications: 0,
    completed: 0,
    pending: 0,
    appointments: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('Checking public user authentication...');
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    console.log('Auth state:', { role, user, hasToken: !!token, userId });
    
    if (role !== 'public' || !token || !userId) {
      console.log('Invalid public session, redirecting to login');
      localStorage.clear();
      navigate('/login');
      return;
    }
    
    if (user) {
      console.log('Setting public username:', user);
      setUsername(user);
      fetchUserInfo(parseInt(userId));
    }
  }, [navigate]);

  const fetchUserInfo = async (userId: number) => {
    try {
      const user = await apiService.getPublicUserById(userId);
      setUserInfo(user);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

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
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'services', label: 'Our Services', icon: Building },
    { id: 'applications', label: 'My Applications', icon: FileText },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'tokens', label: 'Digital Tokens', icon: Ticket },
    { id: 'history', label: 'Service History', icon: Clock },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const availableServices = [
    {
      id: 1,
      name: 'Birth Certificate',
      description: 'Apply for your birth certificate online with easy document submission.',
      icon: CreditCard,
      color: 'bg-blue-500',
      department: 'Registration Department',
      documents: ['Application Form', 'Parent ID Copies', 'Hospital Certificate']
    },
    {
      id: 2,
      name: 'Marriage Certificate',
      description: 'Apply for your marriage certificate online with easy document submission.',
      icon: Heart,
      color: 'bg-pink-500',
      department: 'Registration Department',
      documents: ['Marriage Application', 'ID Copies', 'Photos']
    },
    {
      id: 3,
      name: 'Identity Card',
      description: 'Apply for your identity card online with easy document submission.',
      icon: Shield,
      color: 'bg-green-500',
      department: 'Identity Department',
      documents: ['NIC Application', 'Birth Certificate', 'Photos']
    },
    {
      id: 4,
      name: 'Business License',
      description: 'Apply for your business license online with easy document submission.',
      icon: Briefcase,
      color: 'bg-purple-500',
      department: 'Business Department',
      documents: ['Business Plan', 'Registration', 'Tax Documents']
    },
    {
      id: 5,
      name: 'Land Certificate',
      description: 'Apply for your land certificate online with easy document submission.',
      icon: Home,
      color: 'bg-orange-500',
      department: 'Land Department',
      documents: ['Land Documents', 'Survey Reports', 'Tax Receipts']
    },
    {
      id: 6,
      name: 'Educational Certificate',
      description: 'Apply for your education certificate online with easy document submission.',
      icon: BookOpen,
      color: 'bg-indigo-500',
      department: 'Education Department',
      documents: ['School Records', 'Mark Sheets', 'ID Copies']
    }
  ];

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to DSK Services</h2>
        <p className="text-blue-100 mb-4">Access government services easily and efficiently</p>
        <p className="text-lg">
          Your one-stop portal for all Divisional Secretariat KALMUNAI services. Apply for certificates, book appointments, and track your applications.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">12</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">8</p>
                <p className="text-sm text-gray-600">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full mr-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">3</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full mr-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">2</p>
                <p className="text-sm text-gray-600">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="text-green-800">Quick Actions</CardTitle>
            <CardDescription className="text-green-600">Common services and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <Button 
              onClick={() => setActiveTab('services')} 
              className="w-full justify-start bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Building className="mr-2 h-4 w-4" />
              Browse Services
            </Button>
            <Button 
              onClick={() => setActiveTab('applications')} 
              className="w-full justify-start bg-green-500 hover:bg-green-600 text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              My Applications
            </Button>
            <Button 
              onClick={() => setActiveTab('appointments')} 
              className="w-full justify-start bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-blue-800">Recent Activities</CardTitle>
            <CardDescription className="text-blue-600">Your latest service activities</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Birth Certificate approved</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">NIC application submitted</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Appointment scheduled</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderServicesContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Available Services</h2>
        <p className="text-gray-600">Browse and apply for government services</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableServices.map((service) => {
          const IconComponent = service.icon;
          return (
            <Card key={service.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 ${service.color} rounded-lg`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {service.department}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Required Documents:</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {service.documents.map((doc, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'services':
        return renderServicesContent();
      case 'history':
        return userInfo ? <ServiceHistory publicUser={userInfo} /> : <div>Loading...</div>;
      case 'profile':
        return userInfo ? <ProfileSettings user={userInfo} /> : <div>Loading...</div>;
      case 'applications':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">My Applications</h2>
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No applications found. Start by applying for a service.</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'appointments':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Appointments</h2>
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No appointments scheduled. Book an appointment today.</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'tokens':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Digital Tokens</h2>
            <Card>
              <CardContent className="p-8 text-center">
                <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No active tokens. Request a token for your visit.</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return renderOverviewContent();
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
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">
                {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
                {sidebarOpen && (
                  <span className="text-sm font-medium text-gray-700">
                    Welcome, {username}
                  </span>
                )}
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
