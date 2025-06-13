
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, FileText, DollarSign, Clock, Users } from 'lucide-react';

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

import { apiService } from '@/services/api';

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
  is_active: boolean;
  department_name?: string;
  division_name?: string;
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
  is_active: z.boolean().default(true)
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const ServiceCatalogManagement = () => {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema)
  });

  const selectedDepartmentId = watch('department_id');

  useEffect(() => {
    fetchServices();
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      // Note: You'll need to create this API endpoint
      const response = await fetch('/backend/api/service-catalog/');
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
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

  const filteredDivisions = divisions.filter(d => 
    selectedDepartmentId ? d.department_id === parseInt(selectedDepartmentId) : false
  );

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

      // Note: You'll need to create this API endpoint
      const url = editingService 
        ? `/backend/api/service-catalog/?id=${editingService.id}`
        : '/backend/api/service-catalog/';
      
      const method = editingService ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Service ${editingService ? 'updated' : 'created'} successfully`,
        });
        fetchServices();
        setIsDialogOpen(false);
        reset();
        setEditingService(null);
      } else {
        throw new Error('Failed to save service');
      }
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
    setValue('is_active', service.is_active);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch(`/backend/api/service-catalog/?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Service deleted successfully",
        });
        fetchServices();
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Service Catalog Management</CardTitle>
              <CardDescription>Manage available government services</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2" size={20} />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department_id">Department *</Label>
                      <Select
                        value={selectedDepartmentId}
                        onValueChange={(value) => setValue('department_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
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
                        disabled={!selectedDepartmentId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
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
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading services...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Processing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{service.icon}</span>
                        <span className="font-medium">{service.service_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{service.service_code}</TableCell>
                    <TableCell>{service.department_name}</TableCell>
                    <TableCell>Rs. {service.fee_amount.toFixed(2)}</TableCell>
                    <TableCell>{service.processing_time_days} days</TableCell>
                    <TableCell>
                      <Badge variant={service.is_active ? "default" : "secondary"}>
                        {service.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceCatalogManagement;
