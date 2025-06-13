import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Filter,
  Upload,
  Home,
  ClipboardList,
  Folder,
  AlertCircle,
  Timer,
  Users,
  Volume2
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { apiService } from '@/services/apiService';
import { TokenInfo, ServiceCatalog, UserApplication } from '@/types';

// All interfaces are now imported from @/types

const EnhancedPublicDashboard = () => {
  const { user } = useAuth('public');
  const [activeTab, setActiveTab] = useState('home');
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [myApplications, setMyApplications] = useState<UserApplication[]>([]);
  const [activeToken, setActiveToken] = useState<TokenInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingFlow, setBookingFlow] = useState<{
    step: number;
    selectedService: ServiceCatalog | null;
    uploadedFiles: File[];
  }>({
    step: 0,
    selectedService: null,
    uploadedFiles: []
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    fetchMyApplications();
    fetchActiveToken();
    fetchNotifications();
    
    // Set up real-time token updates
    const tokenInterval = setInterval(fetchActiveToken, 30000);
    return () => clearInterval(tokenInterval);
  }, []);

  useEffect(() => {
    if (activeToken?.is_next) {
      // Play sound alert when token is next
      playNotificationSound();
      toast({
        title: "🔔 Your Turn!",
        description: `Token #${activeToken.token_number} is now being called!`,
        duration: 10000,
      });
    }
  }, [activeToken?.is_next]);

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getPublicServices();
      
      if (response && response.data) {
        // Add category and duration information
        const servicesWithCategory = response.data.map((service: ServiceCatalog) => ({
          ...service,
          category: getCategoryFromDepartment(service.department_name),
          duration_minutes: Math.floor(Math.random() * 20) + 5 // Mock duration
        }));
        setServices(servicesWithCategory);
      } else if (Array.isArray(response)) {
        setServices(response.map((service: ServiceCatalog) => ({
          ...service,
          category: getCategoryFromDepartment(service.department_name),
          duration_minutes: Math.floor(Math.random() * 20) + 5
        })));
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryFromDepartment = (departmentName: string) => {
    if (!departmentName) return 'administrative';
    
    const dept = departmentName.toLowerCase();
    if (dept.includes('social')) return 'social';
    if (dept.includes('business') || dept.includes('commercial')) return 'business';
    if (dept.includes('permit') || dept.includes('license')) return 'permits';
    return 'administrative';
  };

  const fetchMyApplications = async () => {
    try {
      // Mock data - replace with actual API call
      const mockApplications: UserApplication[] = [
        {
          id: 1,
          request_number: 'REQ001',
          service_name: 'Birth Certificate',
          status: 'under_review',
          created_at: new Date().toISOString(),
          estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          fee_amount: 500,
          payment_status: 'paid',
          progress_percentage: 60
        },
        {
          id: 2,
          request_number: 'REQ002',
          service_name: 'Vehicle License Renewal',
          status: 'approved',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_completion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          fee_amount: 1500,
          payment_status: 'paid',
          progress_percentage: 100
        }
      ];
      setMyApplications(mockApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchActiveToken = async () => {
    try {
      // Try to get the active token from the API
      const token = await apiService.getActiveToken();
      
      if (token) {
        setActiveToken({
          token_number: token.token_number,
          estimated_wait_time: token.estimated_wait_time || 0,
          queue_position: token.queue_position || 0,
          status: token.status || 'waiting',
          service_name: token.service_name || 'Service',
          is_next: token.is_next || false
        });
      } else {
        // Fallback to mock data if no token from API
        const mockToken: TokenInfo = {
          token_number: 'A042',
          estimated_wait_time: 15,
          queue_position: 3,
          status: 'waiting',
          service_name: 'Vehicle License Renewal',
          is_next: Math.random() > 0.8 // Randomly simulate being next
        };
        setActiveToken(mockToken);
      }
    } catch (error) {
      console.error('Error in fetchActiveToken:', error);
      // Don't show error to user, just log it
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!user?.id) {
        setNotifications([]);
        return;
      }
      
      // Get notifications from the API
      const notifications = await apiService.getNotifications(user.id, 'public');
      setNotifications(notifications);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      // Don't show error to user, just log it and set empty array
      setNotifications([]);
    }
  };

  const handleServiceBooking = (service: ServiceCatalog) => {
    setBookingFlow({
      step: 1,
      selectedService: service,
      uploadedFiles: []
    });
    setActiveTab('booking');
  };

  const handleBookingStep = (step: number) => {
    setBookingFlow(prev => ({ ...prev, step }));
  };

  const handleFileUpload = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024; // 5MB limit
    });

    setBookingFlow(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...validFiles]
    }));

    if (validFiles.length !== files.length) {
      toast({
        title: "File Validation",
        description: `${files.length - validFiles.length} file(s) rejected. Only PDF, JPG, PNG under 5MB allowed.`,
        variant: "destructive",
      });
    }
  };

  const completeBooking = async () => {
    try {
      // Simulate booking completion
      const tokenNumber = 'A' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      
      setActiveToken({
        token_number: tokenNumber,
        estimated_wait_time: 25,
        queue_position: 8,
        status: 'waiting',
        service_name: bookingFlow.selectedService?.service_name || '',
        is_next: false
      });

      toast({
        title: "✅ Booking Confirmed!",
        description: `Token #${tokenNumber} generated. Wait time: ~25 minutes`,
      });

      setBookingFlow({ step: 0, selectedService: null, uploadedFiles: [] });
      setActiveTab('home');
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const cancelToken = () => {
    setActiveToken(null);
    toast({
      title: "Token Cancelled",
      description: "Your token has been cancelled successfully",
    });
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

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'services', label: 'Services', icon: ClipboardList },
    { id: 'applications', label: 'My Applications', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

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

  const renderLeftMenu = () => (
    <div className="w-64 bg-white shadow-lg border-r">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">{user?.name}</h2>
            <p className="text-xs text-gray-600">ID: {user?.public_id || 'Not assigned'}</p>
          </div>
        </div>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  const renderBookingFlow = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Book Service: {bookingFlow.selectedService?.service_name}</CardTitle>
          <CardDescription>Complete the booking process in 3 simple steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                bookingFlow.step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className={`flex-1 h-2 rounded ${
                bookingFlow.step >= 2 ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                bookingFlow.step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className={`flex-1 h-2 rounded ${
                bookingFlow.step >= 3 ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                bookingFlow.step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
            </div>

            {/* Step Content */}
            {bookingFlow.step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 1: Service Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-3xl">{bookingFlow.selectedService?.icon}</span>
                    <div>
                      <h4 className="font-semibold">{bookingFlow.selectedService?.service_name}</h4>
                      <p className="text-sm text-gray-600">{bookingFlow.selectedService?.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Fee:</span>
                      <span className="ml-2 font-semibold">Rs. {bookingFlow.selectedService?.fee_amount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Processing:</span>
                      <span className="ml-2">{bookingFlow.selectedService?.processing_time_days} days</span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => handleBookingStep(2)} className="w-full">
                  Continue to Upload Documents
                </Button>
              </div>
            )}

            {bookingFlow.step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 2: Upload Documents</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Drag and drop files here or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Select Files
                    </Button>
                  </label>
                </div>
                
                {bookingFlow.uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded Files:</h4>
                    {bookingFlow.uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <CheckCircle size={16} className="text-green-500" />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleBookingStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => handleBookingStep(3)} 
                    disabled={bookingFlow.uploadedFiles.length === 0}
                    className="flex-1"
                  >
                    Continue to Confirm
                  </Button>
                </div>
              </div>
            )}

            {bookingFlow.step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 3: Confirm Booking</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span>{bookingFlow.selectedService?.service_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee:</span>
                      <span>Rs. {bookingFlow.selectedService?.fee_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Documents:</span>
                      <span>{bookingFlow.uploadedFiles.length} uploaded</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleBookingStep(2)}>
                    Back
                  </Button>
                  <Button onClick={completeBooking} className="flex-1 bg-green-600 hover:bg-green-700">
                    ✅ Confirm Booking
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMainContent = () => {
    if (activeTab === 'booking') {
      return renderBookingFlow();
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
              <h2 className="text-4xl font-bold mb-3">Welcome to DSK Services</h2>
              <p className="text-blue-100 text-lg">Hello, {user?.name}!</p>
              <p className="text-blue-200 text-sm">Access government services at your fingertips</p>
            </div>

            {/* Active Token Alert */}
            {activeToken && (
              <Card className={`border-l-4 ${
                activeToken.is_next 
                  ? 'border-l-red-500 bg-red-50 animate-pulse' 
                  : 'border-l-blue-500 bg-blue-50'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {activeToken.is_next && <Volume2 className="h-6 w-6 text-red-500 animate-bounce" />}
                      <div>
                        <h3 className={`font-bold text-lg ${
                          activeToken.is_next ? 'text-red-800' : 'text-blue-800'
                        }`}>
                          {activeToken.is_next ? '🔔 YOU\'RE NEXT!' : 'Active Token'}
                        </h3>
                        <p className={activeToken.is_next ? 'text-red-700' : 'text-blue-700'}>
                          Token #{activeToken.token_number} | Service: {activeToken.service_name}
                        </p>
                        {!activeToken.is_next && (
                          <div className="flex items-center space-x-4 mt-2">
                            <span>Position: {activeToken.queue_position}</span>
                            <span>Wait Time: ~{activeToken.estimated_wait_time} mins</span>
                            <Progress value={(10 - activeToken.queue_position) * 10} className="w-24" />
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={cancelToken}
                    >
                      Cancel Token
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* ... keep existing code (stats cards) */}
            </div>

            {/* Popular Services */}
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
                  {services.slice(0, 4).map((service) => (
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
                              {service.duration_minutes} min process
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-3"
                            onClick={() => handleServiceBooking(service)}
                          >
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'services':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>Available Services</CardTitle>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="administrative">Administrative</TabsTrigger>
                    <TabsTrigger value="business">Business</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                    <TabsTrigger value="permits">Permits</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredServices.map((service) => (
                        <Card key={service.id} className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <span className="text-4xl">{service.icon || '📄'}</span>
                              <Badge variant="secondary" className="text-xs">
                                {service.department_name}
                              </Badge>
                            </div>
                            
                            <h3 className="font-bold text-lg mb-2">{service.service_name}</h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Fee:</span>
                                <span className="font-semibold text-green-600">Rs. {service.fee_amount?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Duration:</span>
                                <span className="text-sm">{service.duration_minutes} min process</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                className="flex-1"
                                onClick={() => handleServiceBooking(service)}
                              >
                                Book Now
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
                  </TabsContent>

                  {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                    <TabsContent key={category} value={category}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryServices.map((service) => (
                          <Card key={service.id} className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <span className="text-4xl">{service.icon || '📄'}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {service.department_name}
                                </Badge>
                              </div>
                              
                              <h3 className="font-bold text-lg mb-2">{service.service_name}</h3>
                              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">Fee:</span>
                                  <span className="font-semibold text-green-600">Rs. {service.fee_amount?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">Duration:</span>
                                  <span className="text-sm">{service.duration_minutes} min process</span>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1"
                                  onClick={() => handleServiceBooking(service)}
                                >
                                  Book Now
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
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        );

      case 'applications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track your service requests and their progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myApplications.length > 0 ? (
                  myApplications.map((app) => (
                    <Card key={app.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{app.service_name}</h4>
                          <Badge className={getStatusColor(app.status)}>
                            {getStatusIcon(app.status)}
                            <span className="ml-1">{app.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">#{app.request_number}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{app.progress_percentage}%</span>
                          </div>
                          <Progress value={app.progress_percentage} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                          <span>Expected: {new Date(app.estimated_completion).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No applications yet</p>
                    <p className="text-sm">Start by applying for a service</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <div>Content for {activeTab}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {renderLeftMenu()}
      <div className="flex-1 p-6">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default EnhancedPublicDashboard;
