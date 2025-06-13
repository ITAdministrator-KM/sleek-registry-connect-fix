
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, FileText, Search, Filter, Download, Eye } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { apiService } from '@/services/apiService';

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

const serviceSchema = z.object({
  service_name: z.string().min(2, 'Service name is required'),
  service_code: z.string().min(2, 'Service code is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department_id: z.string().min(1, 'Department is required'),
  division_id: z.string().optional(),
  icon: z.string().min(1, 'Icon is required'),
  fee_amount: z.number().min(0, 'Fee amount must be positive'),
  required_documents: z.string().min(1, 'Required documents are needed'),
  processing_time_days: z.number().min(1, 'Processing time must be at least 1 day'),
  eligibility_criteria: z.string().optional(),
  form_template_url: z.string().optional(),
  status: z.string().default('active')
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const ServiceCatalogManagement = () => {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [filteredDivisions, setFilteredDivisions] = useState<Division[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const { toast } = useToast();

  const { 
    register, 
    handleSubmit, 
    reset, 
    watch, 
    setValue, 
    formState: { errors } 
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema)
  });

  const selectedDepartmentId = watch('department_id');

  useEffect(() => {
    fetchServices();
    fetchDepartments();
    fetchDivisions();
  }, []);

  useEffect(() => {
    if (selectedDepartmentId) {
      const filtered = divisions.filter(d => d.department_id === parseInt(selectedDepartmentId));
      setFilteredDivisions(filtered);
    } else {
      setFilteredDivisions([]);
    }
  }, [selectedDepartmentId, divisions]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getServices();
      console.log('Services response:', response);
      
      if (response && response.data) {
        setServices(response.data);
      } else if (Array.isArray(response)) {
        setServices(response);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiService.getDivisions();
      setDivisions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const serviceData = {
        ...data,
        department_id: parseInt(data.department_id),
        division_id: data.division_id ? parseInt(data.division_id) : null,
        required_documents: data.required_documents.split(',').map(doc => doc.trim()),
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
      reset();
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
    setValue('service_name', service.service_name);
    setValue('service_code', service.service_code);
    setValue('description', service.description);
    setValue('department_id', service.department_id.toString());
    setValue('division_id', service.division_id?.toString() || '');
    setValue('icon', service.icon);
    setValue('fee_amount', service.fee_amount);
    setValue('required_documents', service.required_documents.join(', '));
    setValue('processing_time_days', service.processing_time_days);
    setValue('eligibility_criteria', service.eligibility_criteria || '');
    setValue('form_template_url', service.form_template_url || '');
    setValue('status', service.status);
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

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.service_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || 
                             service.department_id === parseInt(selectedDepartment);
    const matchesStatus = selectedStatus === 'all' || service.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const servicesByCategory = {
    administrative: filteredServices.filter(s => s.department_name?.toLowerCase().includes('admin')),
    business: filteredServices.filter(s => s.department_name?.toLowerCase().includes('business')),
    social: filteredServices.filter(s => s.department_name?.toLowerCase().includes('social')),
    permits: filteredServices.filter(s => s.department_name?.toLowerCase().includes('permit'))
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Service Catalog Management</CardTitle>
              <CardDescription>Manage and oversee system operations</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2" size={20} />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_name">Service Name *</Label>
                      <Input
                        id="service_name"
                        {...register('service_name')}
                        placeholder="Vehicle License Renewal"
                      />
                      {errors.service_name && (
                        <p className="text-sm text-red-500">{errors.service_name.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="service_code">Service Code *</Label>
                      <Input
                        id="service_code"
                        {...register('service_code')}
                        placeholder="VLR001"
                      />
                      {errors.service_code && (
                        <p className="text-sm text-red-500">{errors.service_code.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Detailed description of the service"
                      rows={3}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department_id">Department *</Label>
                      <Select
                        value={watch('department_id') || ''}
                        onValueChange={(value) => {
                          setValue('department_id', value);
                          setValue('division_id', ''); // Reset division when department changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.department_id && (
                        <p className="text-sm text-red-500">{errors.department_id.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="division_id">Division</Label>
                      <Select
                        value={watch('division_id') || ''}
                        onValueChange={(value) => setValue('division_id', value)}
                        disabled={!selectedDepartmentId || filteredDivisions.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedDepartmentId 
                              ? "Select department first" 
                              : filteredDivisions.length === 0 
                                ? "No divisions available" 
                                : "Select division"
                          } />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {filteredDivisions.map((div) => (
                            <SelectItem key={div.id} value={div.id.toString()}>
                              {div.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon *</Label>
                      <Input
                        id="icon"
                        {...register('icon')}
                        placeholder="🚗"
                      />
                      {errors.icon && (
                        <p className="text-sm text-red-500">{errors.icon.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fee_amount">Fee Amount (Rs.)</Label>
                      <Input
                        id="fee_amount"
                        type="number"
                        step="0.01"
                        {...register('fee_amount', { valueAsNumber: true })}
                        placeholder="1500.00"
                      />
                      {errors.fee_amount && (
                        <p className="text-sm text-red-500">{errors.fee_amount.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="processing_time_days">Processing Days</Label>
                      <Input
                        id="processing_time_days"
                        type="number"
                        {...register('processing_time_days', { valueAsNumber: true })}
                        placeholder="7"
                      />
                      {errors.processing_time_days && (
                        <p className="text-sm text-red-500">{errors.processing_time_days.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="required_documents">Required Documents *</Label>
                    <Textarea
                      id="required_documents"
                      {...register('required_documents')}
                      placeholder="Vehicle Registration, Insurance Certificate, Revenue License (comma separated)"
                      rows={2}
                    />
                    {errors.required_documents && (
                      <p className="text-sm text-red-500">{errors.required_documents.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eligibility_criteria">Eligibility Criteria</Label>
                    <Textarea
                      id="eligibility_criteria"
                      {...register('eligibility_criteria')}
                      placeholder="Who can apply for this service..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={watch('status') || 'active'}
                      onValueChange={(value) => setValue('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingService(null);
                        reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingService ? 'Update' : 'Create'} Service
                    </Button>
                  </div>
                </form>
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
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Services Table/Grid */}
          <Tabs defaultValue="table" className="space-y-4">
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="category">Category View</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              {isLoading ? (
                <div className="text-center py-8">Loading services...</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Processing</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{service.icon}</span>
                              <div>
                                <div className="font-medium">{service.service_name}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {service.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{service.service_code}</TableCell>
                          <TableCell>{service.department_name || 'N/A'}</TableCell>
                          <TableCell>{service.division_name || 'N/A'}</TableCell>
                          <TableCell>Rs. {service.fee_amount.toFixed(2)}</TableCell>
                          <TableCell>{service.processing_time_days} days</TableCell>
                          <TableCell>
                            <Badge variant={service.status === 'active' ? "default" : "secondary"}>
                              {service.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(service)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="category">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="capitalize">{category} Services</CardTitle>
                      <CardDescription>{categoryServices.length} services available</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categoryServices.slice(0, 5).map((service) => (
                          <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">{service.icon}</span>
                              <div>
                                <div className="font-medium text-sm">{service.service_name}</div>
                                <div className="text-xs text-gray-500">Rs. {service.fee_amount.toFixed(2)}</div>
                              </div>
                            </div>
                            <Badge variant={service.status === 'active' ? "default" : "secondary"}>
                              {service.status}
                            </Badge>
                          </div>
                        ))}
                        {categoryServices.length > 5 && (
                          <div className="text-sm text-gray-500 text-center">
                            +{categoryServices.length - 5} more services
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceCatalogManagement;
