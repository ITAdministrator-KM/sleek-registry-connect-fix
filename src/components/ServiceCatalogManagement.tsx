
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, type ServiceCatalog } from "@/services/apiService";
import { ServiceCatalogDialog } from './service-catalog/ServiceCatalogDialog';
import ServiceCatalogTable from './service-catalog/ServiceCatalogTable';
import { ServiceCatalogErrorBoundary } from './ServiceCatalogErrorBoundary';
import type { ServiceFormData } from './service-catalog/ServiceCatalogTypes';
import { Plus } from 'lucide-react';

const ServiceCatalogManagement: React.FC = () => {
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
      console.error('Create service error:', error);
      toast({
        title: "Error",
        description: `Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      console.error('Update service error:', error);
      toast({
        title: "Error",
        description: `Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      console.error('Delete service error:', error);
      toast({
        title: "Error",
        description: `Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    try {
      const serviceData = {
        service_name: formData.service_name,
        service_code: formData.service_code,
        description: formData.description,
        department_id: parseInt(formData.department_id) || 0,
        division_id: formData.division_id ? parseInt(formData.division_id) : undefined,
        icon: formData.icon || '📄',
        fee_amount: parseFloat(formData.fee_amount) || 0,
        required_documents: formData.required_documents,
        processing_time_days: parseInt(formData.processing_time_days) || 1,
        eligibility_criteria: formData.eligibility_criteria,
        form_template_url: formData.form_template_url,
        status: formData.status
      };

      if (isEditing && editingService) {
        updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
      } else {
        createServiceMutation.mutate(serviceData);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please check your input.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: ServiceCatalog) => {
    try {
      setEditingService(service);
      setFormData({
        service_name: service.service_name || '',
        service_code: service.service_code || '',
        description: service.description || '',
        department_id: service.department_id?.toString() || '',
        division_id: service.division_id?.toString() || '',
        icon: service.icon || '',
        fee_amount: service.fee_amount?.toString() || '',
        required_documents: Array.isArray(service.required_documents) 
          ? service.required_documents 
          : [],
        processing_time_days: service.processing_time_days?.toString() || '',
        eligibility_criteria: service.eligibility_criteria || '',
        form_template_url: service.form_template_url || '',
        status: service.status || 'active'
      });
      setIsEditing(true);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Edit error:', error);
      toast({
        title: "Error",
        description: "Failed to load service data for editing.",
        variant: "destructive",
      });
    }
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
          <p className="text-red-600">Error loading services: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ServiceCatalogErrorBoundary>
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
            <ServiceCatalogTable
              services={services}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
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
    </ServiceCatalogErrorBoundary>
  );
};

export default ServiceCatalogManagement;
