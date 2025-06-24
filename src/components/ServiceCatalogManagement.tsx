
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, type ServiceCatalog } from "@/services/apiService";
import { ServiceCatalogDialog } from './service-catalog/ServiceCatalogDialog';
import type { ServiceFormData } from './service-catalog/ServiceCatalogTypes';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ServiceCatalogManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);
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
    status: 'active'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch services
  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: apiService.getServices,
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: apiService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Service created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create service: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServiceCatalog> }) => 
      apiService.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update service: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: apiService.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete service: ${error.message}`,
        variant: "destructive",
      });
    },
  });

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
      status: 'active'
    });
    setEditingService(null);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentsChange = (documents: string[]) => {
    setFormData(prev => ({
      ...prev,
      required_documents: documents
    }));
  };

  const handleStatusChange = (status: 'active' | 'inactive') => {
    setFormData(prev => ({
      ...prev,
      status
    }));
  };

  const handleSubmit = () => {
    const serviceData = {
      service_name: formData.service_name,
      service_code: formData.service_code,
      description: formData.description,
      department_id: parseInt(formData.department_id) || 0,
      division_id: parseInt(formData.division_id) || undefined,
      icon: formData.icon,
      fee_amount: parseFloat(formData.fee_amount) || 0,
      required_documents: formData.required_documents,
      processing_time_days: parseInt(formData.processing_time_days) || 0,
      eligibility_criteria: formData.eligibility_criteria,
      form_template_url: formData.form_template_url,
      status: formData.status
    };

    if (isEditing && editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  const handleEdit = (service: ServiceCatalog) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      service_code: service.service_code,
      description: service.description,
      department_id: service.department_id.toString(),
      division_id: service.division_id?.toString() || '',
      icon: service.icon || '',
      fee_amount: service.fee_amount.toString(),
      required_documents: Array.isArray(service.required_documents) 
        ? service.required_documents 
        : [],
      processing_time_days: service.processing_time_days.toString(),
      eligibility_criteria: service.eligibility_criteria || '',
      form_template_url: service.form_template_url || '',
      status: service.status
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteServiceMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading services: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Service Catalog Management</CardTitle>
              <CardDescription>
                Manage services offered by the Divisional Secretariat
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading services...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Fee Amount</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.service_name}</TableCell>
                    <TableCell>{service.service_code}</TableCell>
                    <TableCell>{service.department_name || 'N/A'}</TableCell>
                    <TableCell>Rs. {service.fee_amount}</TableCell>
                    <TableCell>{service.processing_time_days} days</TableCell>
                    <TableCell>
                      <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <ServiceCatalogDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        isEditing={isEditing}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onStatusChange={handleStatusChange}
        onDocumentsChange={handleDocumentsChange}
      />
    </div>
  );
};

export default ServiceCatalogManagement;
