
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast";

import StaffLayout from './staff/StaffLayout';
import { apiService, ServiceCatalog } from '@/services/apiService';
import { ServiceCatalogDialog } from './service-catalog/ServiceCatalogDialog';
import type { ServiceFormData } from './service-catalog/ServiceCatalogTypes';

const ServiceCatalogManagement = () => {
  const [activeTab, setActiveTab] = useState('service-catalog');
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ServiceFormData>({
    service_name: '',
    service_code: '',
    description: '',
    department_id: '',
    division_id: '',
    icon: '',
    fee_amount: '',
    required_documents: [],
    processing_time_days: '',
    eligibility_criteria: '',
    form_template_url: '',
    status: 'active',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await apiService.getServices();
      console.log('Fetched services:', data);
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'required_documents') {
      setFormData(prevState => ({
        ...prevState,
        required_documents: value.split(',').map(doc => doc.trim()).filter(doc => doc.length > 0)
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [id]: value
      }));
    }
  };

  const handleStatusChange = (value: 'active' | 'inactive') => {
    setFormData(prevState => ({
      ...prevState,
      status: value
    }));
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setSelectedService(null);
    resetForm();
  };

  const handleCreate = () => {
    setIsDialogOpen(true);
    setIsEditing(false);
    resetForm();
  };

  const handleEdit = (service: ServiceCatalog) => {
    setIsDialogOpen(true);
    setIsEditing(true);
    setSelectedService(service);
    
    // Handle required_documents properly - it might be a string or array
    let requiredDocuments: string[] = [];
    if (typeof service.required_documents === 'string') {
      try {
        // Try to parse as JSON first
        requiredDocuments = JSON.parse(service.required_documents);
      } catch {
        // If parsing fails, split by comma
        requiredDocuments = service.required_documents.split(',').map(doc => doc.trim()).filter(doc => doc.length > 0);
      }
    } else if (Array.isArray(service.required_documents)) {
      requiredDocuments = service.required_documents;
    }

    setFormData({
      service_name: service.service_name,
      service_code: service.service_code,
      description: service.description,
      department_id: service.department_id?.toString() || '',
      division_id: service.division_id?.toString() || '',
      icon: service.icon || '',
      fee_amount: service.fee_amount?.toString() || '',
      required_documents: requiredDocuments,
      processing_time_days: service.processing_time_days?.toString() || '',
      eligibility_criteria: service.eligibility_criteria || '',
      form_template_url: service.form_template_url || '',
      status: service.status,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteService(id);
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      fetchServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const serviceData = {
        service_name: formData.service_name,
        service_code: formData.service_code,
        description: formData.description,
        department_id: parseInt(formData.department_id) || null,
        division_id: formData.division_id ? parseInt(formData.division_id) : null,
        icon: formData.icon,
        fee_amount: parseFloat(formData.fee_amount) || 0,
        required_documents: formData.required_documents,
        processing_time_days: parseInt(formData.processing_time_days) || 7,
        eligibility_criteria: formData.eligibility_criteria,
        form_template_url: formData.form_template_url,
        status: formData.status,
      };

      if (isEditing && selectedService) {
        await apiService.updateService(selectedService.id, serviceData);
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
      handleDialogClose();
    } catch (error) {
      console.error('Failed to save service:', error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      service_code: '',
      description: '',
      department_id: '',
      division_id: '',
      icon: '',
      fee_amount: '',
      required_documents: [],
      processing_time_days: '',
      eligibility_criteria: '',
      form_template_url: '',
      status: 'active',
    });
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || service.department_id?.toString() === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <StaffLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="container mx-auto py-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Service Catalog Management</CardTitle>
            <Button variant="outline" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="1">Department 1</SelectItem>
                  <SelectItem value="2">Department 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                    </TableRow>
                  ) : filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">No services found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.service_code}</TableCell>
                        <TableCell>{service.service_name}</TableCell>
                        <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                        <TableCell>{service.department_id}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            service.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {service.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <ServiceCatalogDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          isEditing={isEditing}
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onStatusChange={handleStatusChange}
        />
      </div>
    </StaffLayout>
  );
};

export default ServiceCatalogManagement;
