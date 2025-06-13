
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Calendar,
  Clock,
  FileText,
  Download,
  Bell,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Star,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface ServiceCatalog {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  icon: string;
  fee_amount: number;
  processing_time_days: number;
  department_name: string;
  is_popular: boolean;
}

interface UserApplication {
  id: number;
  request_number: string;
  service_name: string;
  status: string;
  created_at: string;
  estimated_completion: string;
  fee_amount: number;
  payment_status: string;
}

interface TokenInfo {
  token_number: string;
  estimated_wait_time: number;
  queue_position: number;
  status: string;
}

const EnhancedPublicDashboard = () => {
  const { user } = useAuth('public');
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [myApplications, setMyApplications] = useState<UserApplication[]>([]);
  const [activeToken, setActiveToken] = useState<TokenInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notifications, setNotifications] = useState([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    fetchMyApplications();
    fetchActiveToken();
    fetchNotifications();
  }, []);

  const fetchServices = async () => {
    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch('/backend/api/service-catalog/public');
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchMyApplications = async () => {
    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch(`/backend/api/service-requests/user/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setMyApplications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchActiveToken = async () => {
    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch(`/backend/api/tokens/active/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setActiveToken(data.data);
      }
    } catch (error) {
      console.error('Error fetching active token:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch(`/backend/api/notifications/user/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleServiceBooking = (service: ServiceCatalog) => {
    toast({
      title: "Service Booking",
      description: `Starting application for ${service.service_name}`,
    });
    // Navigate to booking flow
  };

  const handleCancelToken = async () => {
    try {
      if (!activeToken) return;
      
      // Note: You'll need to create this API endpoint
      const response = await fetch(`/backend/api/tokens/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_number: activeToken.token_number })
      });

      if (response.ok) {
        setActiveToken(null);
        toast({
          title: "Token Cancelled",
          description: "Your token has been cancelled successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel token",
        variant: "destructive",
      });
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           service.department_name.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const popularServices = services.filter(service => service.is_popular).slice(0, 4);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-3">Welcome to DSK Services</h2>
        <p className="text-blue-100 text-lg">Hello, {user?.name}!</p>
        <p className="text-blue-200 text-sm">Access government services at your fingertips</p>
      </div>

      {/* Active Token Alert */}
      {activeToken && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-blue-800 text-lg">Active Token</h3>
                <p className="text-blue-700">
                  Token #{activeToken.token_number} | Position: {activeToken.queue_position} | 
                  Wait Time: ~{activeToken.estimated_wait_time} mins
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleCancelToken}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Cancel Token
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-800">{myApplications.length}</p>
                <p className="text-green-600 text-sm font-medium">My Applications</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-800">{services.length}</p>
                <p className="text-blue-600 text-sm font-medium">Available Services</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-800">
                  {myApplications.filter(app => app.status === 'pending').length}
                </p>
                <p className="text-orange-600 text-sm font-medium">Pending Reviews</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-800">{notifications.length}</p>
                <p className="text-purple-600 text-sm font-medium">Notifications</p>
              </div>
              <Bell className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Services */}
      {popularServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-500" />
              Popular Services
            </CardTitle>
            <CardDescription>Most requested government services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularServices.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <span className="text-3xl mb-3 block">{service.icon}</span>
                      <h3 className="font-semibold text-sm mb-2">{service.service_name}</h3>
                      <p className="text-xs text-gray-600 mb-3">{service.department_name}</p>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-green-600">
                          Rs. {service.fee_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {service.processing_time_days} days processing
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => handleServiceBooking(service)}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Catalog */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-blue-500" />
                Available Services
              </CardTitle>
              <CardDescription>Browse and apply for government services</CardDescription>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{service.icon}</span>
                    <Badge variant="secondary" className="text-xs">
                      {service.department_name}
                    </Badge>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2">{service.service_name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Fee:</span>
                      <span className="font-semibold text-green-600">Rs. {service.fee_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Processing:</span>
                      <span className="text-sm">{service.processing_time_days} days</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleServiceBooking(service)}
                    >
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-green-500" />
              My Applications
            </CardTitle>
            <CardDescription>Track your service requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myApplications.length > 0 ? (
                myApplications.slice(0, 5).map((app) => (
                  <div key={app.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{app.service_name}</h4>
                      <Badge className={getStatusColor(app.status)}>
                        {getStatusIcon(app.status)}
                        <span className="ml-1">{app.status}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">#{app.request_number}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                      <span>Expected: {new Date(app.estimated_completion).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No applications yet</p>
                  <p className="text-sm">Start by applying for a service above</p>
                </div>
              )}
            </div>
            
            {myApplications.length > 5 && (
              <Button variant="outline" className="w-full mt-4">
                View All Applications
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Profile Quick View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-6 w-6 text-purple-500" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold">{user?.name}</h3>
                  <p className="text-sm text-gray-600">Public ID: {user?.public_id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{user?.nic}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{user?.mobile}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{user?.address}</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedPublicDashboard;
