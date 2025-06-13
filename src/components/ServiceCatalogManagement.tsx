
import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { apiService } from '@/services/apiService';
import { ApiErrorHandler } from '@/services/errorHandler';
import ServiceCatalogTable from './service-catalog/ServiceCatalogTable';
import ServiceCatalogForm from './service-catalog/ServiceCatalogForm';

interface ServiceCatalog {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  department_id: number;
  division_id?: number;
  icon: string;
  fee_amount: number;
  required_documents: string[];
  processing_time_days: number;
  eligibility_criteria?: string;
  form_template_url?: string;
  status: string;
  department_name?: string;
  division_name?: string;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department_id: number;
}

const ServiceCatalogManagement = () => {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetchServices(),
      fetchDepartments(),
      fetchDivisions()
    ]);
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await ApiErrorHandler.safeApiCall(
        () => apiService.getServices(),
        []
      );
      
      const servicesData = ApiErrorHandler.handleApiResponse(response, []);
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await ApiErrorHandler.safeApiCall(
        () => apiService.getDepartments(),
        []
      );
      const departmentsData = ApiErrorHandler.handleApiResponse(response, []);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await ApiErrorHandler.safeApiCall(
        () => apiService.getDivisions(),
        []
      );
      const divisionsData = ApiErrorHandler.handleApiResponse(response, []);
      setDivisions(divisionsData);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const serviceData = {
        ...data,
        department_id: parseInt(data.department_id),
        division_id: data.division_id ? parseInt(data.division_id) : null,
        required_documents: data.required_documents.split(',').map((doc: string) => doc.trim()),
        fee_amount: Number(data.fee_amount),
        processing_time_days: Number(data.processing_time_days)
      };

      if (editingService) {
        await apiService.updateService(editingService.id, serviceData);
        toast({
          title: "Success",
          description: "Service updated successfully",
        });
      } else {
        await apiService.createService(serviceData);
        toast({
          title: "Success",
          description: "Service created successfully",
        });
      }

      fetchServices();
      setIsDialogOpen(false);
      setEditingService(null);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingService ? 'update' : 'create'} service`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: ServiceCatalog) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await apiService.deleteService(id);
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      fetchServices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingService(null);
    setIsDialogOpen(false);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.service_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || 
                             service.department_id === parseInt(selectedDepartment);
    const matchesStatus = selectedStatus === 'all' || service.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Service Catalog Management</CardTitle>
              <CardDescription>Manage and oversee system operations</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  onClick={() => {
                    setEditingService(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2" size={20} />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </DialogTitle>
                </DialogHeader>
                <ServiceCatalogForm
                  onSubmit={onSubmit}
                  onCancel={handleCancel}
                  departments={departments}
                  divisions={divisions}
                  editingService={editingService}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filter Section */}
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services Table */}
          <Tabs defaultValue="table" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="category">Category View</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <ServiceCatalogTable
                services={filteredServices}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="category">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => {
                  const deptServices = filteredServices.filter(s => s.department_id === dept.id);
                  return (
                    <Card key={dept.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <CardDescription>{deptServices.length} services available</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {deptServices.slice(0, 5).map((service) => (
                            <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3 min-w-0">
                                <span className="text-xl flex-shrink-0">{service.icon}</span>
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{service.service_name}</div>
                                  <div className="text-xs text-gray-500">Rs. {service.fee_amount.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {deptServices.length > 5 && (
                            <div className="text-sm text-gray-500 text-center">
                              +{deptServices.length - 5} more services
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceCatalogManagement;
