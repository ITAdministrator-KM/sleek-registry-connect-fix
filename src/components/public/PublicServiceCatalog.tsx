import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Calendar } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService, ServiceCatalog } from '@/services/apiService';

const PublicServiceCatalog = () => {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const servicesData = await apiService.getPublicServices();
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceBooking = (service: ServiceCatalog) => {
    toast({
      title: "Service Booking",
      description: `Booking process for ${service.service_name} will be implemented soon.`,
    });
  };

  const filteredServices = services.filter(service => 
    service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group services by department
  const servicesByDepartment = filteredServices.reduce((acc, service) => {
    const dept = service.department_name || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(service);
    return acc;
  }, {} as Record<string, ServiceCatalog[]>);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
          <CardDescription>Browse and apply for government services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Services by Department */}
          <Tabs defaultValue={Object.keys(servicesByDepartment)[0]} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              {Object.keys(servicesByDepartment).slice(0, 4).map((dept) => (
                <TabsTrigger key={dept} value={dept} className="text-xs">
                  {dept}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(servicesByDepartment).map(([department, departmentServices]) => (
              <TabsContent key={department} value={department}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departmentServices.map((service) => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-3xl">{service.icon || '📄'}</span>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{service.service_name}</h3>
                            <p className="text-xs text-gray-500">{service.service_code}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                        
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex items-center justify-between">
                            <span>💰 Fee: Rs. {service.fee_amount || 0}</span>
                            <span>⏱️ Processing: {service.processing_time_days || service.processing_time || 'N/A'} days</span>
                          </div>
                          <div>
                            <span>🏢 Department: {service.department_name}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                            onClick={() => handleServiceBooking(service)}
                          >
                            <Calendar size={12} className="mr-1" />
                            Apply Now
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Download size={12} className="mr-1" />
                            Download Form
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No services found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicServiceCatalog;
