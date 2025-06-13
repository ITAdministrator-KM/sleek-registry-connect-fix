
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  Download,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Upload,
  Eye,
  CreditCard,
  Timer
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import PublicLayout from './public/PublicLayout';
import { ApiErrorHandler } from '@/services/errorHandler';
import { ServiceCatalog, UserApplication, TokenInfo } from '@/types';

const EnhancedPublicDashboard = () => {
  const { user } = useAuth('public');
  const [activeTab, setActiveTab] = useState('home');
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [activeToken, setActiveToken] = useState<TokenInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isBookingFlow, setIsBookingFlow] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    fetchApplications();
    fetchActiveToken();
    
    // Real-time token updates
    const tokenInterval = setInterval(fetchActiveToken, 30000);
    return () => clearInterval(tokenInterval);
  }, []);

  const fetchServices = async () => {
    try {
      const mockServices: ServiceCatalog[] = [
        {
          id: 1,
          service_name: 'Vehicle License Renewal',
          service_code: 'VLR001',
          description: 'Renew your vehicle license with ease',
          icon: '🚗',
          fee_amount: 1500,
          processing_time_days: 7,
          department_name: 'Transport',
          status: 'active',
          category: 'administrative',
          duration_minutes: 15
        },
        {
          id: 2,
          service_name: 'Birth Certificate',
          service_code: 'BC001',
          description: 'Apply for birth certificate',
          icon: '👶',
          fee_amount: 500,
          processing_time_days: 5,
          department_name: 'Civil Registration',
          status: 'active',
          category: 'social',
          duration_minutes: 10
        },
        {
          id: 3,
          service_name: 'Business Registration',
          service_code: 'BR001',
          description: 'Register your new business',
          icon: '🏢',
          fee_amount: 2500,
          processing_time_days: 14,
          department_name: 'Commerce',
          status: 'active',
          category: 'business',
          duration_minutes: 30
        }
      ];
      setServices(mockServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      ApiErrorHandler.handleAuthError(error);
    }
  };

  const fetchApplications = async () => {
    try {
      const mockApplications: UserApplication[] = [
        {
          id: 1,
          request_number: 'REQ001',
          service_name: 'Vehicle License Renewal',
          status: 'under_review',
          created_at: '2024-01-15T10:00:00Z',
          estimated_completion: '2024-01-22T17:00:00Z',
          fee_amount: 1500,
          payment_status: 'paid',
          progress_percentage: 65
        }
      ];
      setApplications(mockApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchActiveToken = async () => {
    try {
      // Mock token data
      const mockToken: TokenInfo = {
        token_number: 'T042',
        estimated_wait_time: 15,
        queue_position: 3,
        status: 'waiting',
        service_name: 'Vehicle License Renewal',
        is_next: false
      };
      setActiveToken(mockToken);
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const handleServiceBooking = (service: ServiceCatalog) => {
    setSelectedService(service);
    setIsBookingFlow(true);
    setBookingStep(1);
  };

  const handleBookingComplete = () => {
    setIsBookingFlow(false);
    setBookingStep(1);
    setSelectedService(null);
    
    toast({
      title: "Booking Successful! ✅",
      description: "Your token has been generated. Please wait for your turn.",
    });
    
    // Generate new token
    const newToken: TokenInfo = {
      token_number: `T${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      estimated_wait_time: Math.floor(Math.random() * 30) + 10,
      queue_position: Math.floor(Math.random() * 10) + 1,
      status: 'waiting',
      service_name: selectedService?.service_name || '',
      is_next: false
    };
    setActiveToken(newToken);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const servicesByCategory = {
    administrative: filteredServices.filter(s => s.category === 'administrative'),
    business: filteredServices.filter(s => s.category === 'business'),
    social: filteredServices.filter(s => s.category === 'social'),
    permits: filteredServices.filter(s => s.category === 'permits')
  };

  const renderBookingFlow = () => {
    if (!selectedService) return null;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Book Service: {selectedService.service_name}</span>
            <Button variant="outline" onClick={() => setIsBookingFlow(false)}>✖️</Button>
          </CardTitle>
          <Progress value={(bookingStep / 3) * 100} className="w-full" />
        </CardHeader>
        <CardContent>
          {bookingStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 1: Service Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-3xl">{selectedService.icon}</span>
                  <div>
                    <h4 className="font-medium">{selectedService.service_name}</h4>
                    <p className="text-sm text-gray-600">{selectedService.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Fee:</span> Rs. {selectedService.fee_amount}
                  </div>
                  <div>
                    <span className="font-medium">Processing:</span> {selectedService.processing_time_days} days
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> ~{selectedService.duration_minutes} minutes
                  </div>
                  <div>
                    <span className="font-medium">Department:</span> {selectedService.department_name}
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => setBookingStep(2)}>
                Continue to Documents
              </Button>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 2: Upload Documents</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Drag and drop your documents here</p>
                <Button variant="outline">Choose Files</Button>
                <p className="text-xs text-gray-500 mt-2">Accepted: PDF, JPG, PNG (Max 5MB each)</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setBookingStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setBookingStep(3)}>
                  Continue to Confirmation
                </Button>
              </div>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 3: Confirmation</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="font-medium text-green-800">Ready to Submit</span>
                </div>
                <p className="text-sm text-green-700">
                  Your application for "{selectedService.service_name}" is ready to be submitted.
                  You will receive a token number for queue management.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setBookingStep(2)}>
                  Back
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleBookingComplete}>
                  🎉 Confirm & Get Token
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderServices = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-white shadow-lg z-50">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="administrative">Administrative</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="social">Social Services</SelectItem>
            <SelectItem value="permits">Permits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isBookingFlow ? renderBookingFlow() : (
        <Tabs defaultValue="administrative" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="administrative">Administrative</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="permits">Permits</TabsTrigger>
          </TabsList>

          {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-3xl">{service.icon}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{service.service_name}</h3>
                          <p className="text-xs text-gray-500">{service.department_name}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500 mb-4">
                        <div className="flex items-center justify-between">
                          <span>💰 Fee: Rs. {service.fee_amount}</span>
                          <span>⏱️ ~{service.duration_minutes} min</span>
                        </div>
                        <div>
                          <span>📅 Processing: {service.processing_time_days} days</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                          onClick={() => handleServiceBooking(service)}
                        >
                          📝 Book Now
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                          📄 Download Form
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );

  const renderMainContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
              <h2 className="text-2xl md:text-4xl font-bold mb-3">Public Services Portal</h2>
              <p className="text-blue-100 text-lg">Welcome, {user?.name || 'Citizen'}!</p>
              <p className="text-blue-200 text-sm">Access government services digitally</p>
            </div>

            {/* Active Token Banner */}
            {activeToken && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 text-white rounded-full px-3 py-1 font-bold">
                        {activeToken.token_number}
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{activeToken.service_name}</p>
                        <p className="text-sm text-blue-600">
                          Position: {activeToken.queue_position} | Wait: ~{activeToken.estimated_wait_time} min
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">❌ Cancel</Button>
                  </div>
                  <Progress value={((10 - activeToken.queue_position) / 10) * 100} className="mt-2" />
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-green-800">{services.length}</p>
                      <p className="text-green-600 text-sm font-medium">Available Services</p>
                    </div>
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-blue-800">{applications.length}</p>
                      <p className="text-blue-600 text-sm font-medium">My Applications</p>
                    </div>
                    <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-orange-800">
                        {activeToken ? activeToken.queue_position : 0}
                      </p>
                      <p className="text-orange-600 text-sm font-medium">Queue Position</p>
                    </div>
                    <Timer className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-purple-800">
                        {applications.filter(a => a.status === 'approved').length}
                      </p>
                      <p className="text-purple-600 text-sm font-medium">Completed</p>
                    </div>
                    <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Services</CardTitle>
                  <CardDescription>Most frequently used services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {services.slice(0, 3).map((service) => (
                    <Button 
                      key={service.id}
                      onClick={() => {
                        setActiveTab('services');
                        handleServiceBooking(service);
                      }}
                      className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-green-600"
                    >
                      <span className="mr-3 text-lg">{service.icon}</span>
                      {service.service_name}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Track your application status</CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.length > 0 ? (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div key={app.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{app.service_name}</h4>
                            <Badge variant="outline">{app.status.replace('_', ' ')}</Badge>
                          </div>
                          <Progress value={app.progress_percentage} className="mb-2" />
                          <p className="text-xs text-gray-500">
                            Expected completion: {new Date(app.estimated_completion).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No applications yet</p>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setActiveTab('services')}
                      >
                        Browse Services
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'services':
        return renderServices();
      case 'applications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track your service requests</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{app.service_name}</h3>
                            <p className="text-sm text-gray-500">#{app.request_number}</p>
                          </div>
                          <Badge variant="outline">{app.status.replace('_', ' ')}</Badge>
                        </div>
                        <Progress value={app.progress_percentage} className="mb-3" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Applied:</span> {new Date(app.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Expected:</span> {new Date(app.estimated_completion).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Fee:</span> Rs. {app.fee_amount}
                          </div>
                          <div>
                            <span className="font-medium">Payment:</span> 
                            <Badge variant={app.payment_status === 'paid' ? 'default' : 'destructive'} className="ml-1">
                              {app.payment_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Eye size={14} className="mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download size={14} className="mr-1" />
                            Download Receipt
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">No applications yet</p>
                  <Button onClick={() => setActiveTab('services')}>
                    Browse Services
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      default:
        return renderServices();
    }
  };

  return (
    <PublicLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderMainContent()}
    </PublicLayout>
  );
};

export default EnhancedPublicDashboard;
