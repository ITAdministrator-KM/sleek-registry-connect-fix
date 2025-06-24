
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ServiceFormData } from './ServiceCatalogTypes';

interface ServiceCatalogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  formData: ServiceFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onStatusChange: (value: 'active' | 'inactive') => void;
  onDocumentsChange: (documents: string[]) => void;
}

export const ServiceCatalogDialog: React.FC<ServiceCatalogDialogProps> = ({
  isOpen,
  onClose,
  isEditing,
  formData,
  onInputChange,
  onSubmit,
  onStatusChange,
  onDocumentsChange
}) => {
  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const documents = value.split(',').map(doc => doc.trim()).filter(doc => doc.length > 0);
    onDocumentsChange(documents);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Service' : 'Create Service'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edit the service details.' : 'Add a new service to the catalog.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="service_name" className="text-right">
              Name
            </Label>
            <Input 
              type="text" 
              id="service_name" 
              name="service_name"
              value={formData.service_name} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="service_code" className="text-right">
              Code
            </Label>
            <Input 
              type="text" 
              id="service_code" 
              name="service_code"
              value={formData.service_code} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea 
              id="description" 
              name="description"
              value={formData.description} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department_id" className="text-right">
              Department ID
            </Label>
            <Input 
              type="text" 
              id="department_id" 
              name="department_id"
              value={formData.department_id} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="division_id" className="text-right">
              Division ID
            </Label>
            <Input 
              type="text" 
              id="division_id" 
              name="division_id"
              value={formData.division_id} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icon
            </Label>
            <Input 
              type="text" 
              id="icon" 
              name="icon"
              value={formData.icon} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fee_amount" className="text-right">
              Fee Amount
            </Label>
            <Input 
              type="text" 
              id="fee_amount" 
              name="fee_amount"
              value={formData.fee_amount} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="required_documents" className="text-right">
              Required Documents
            </Label>
            <Input 
              type="text" 
              id="required_documents" 
              name="required_documents"
              value={formData.required_documents.join(', ')} 
              onChange={handleDocumentsChange} 
              className="col-span-3" 
              placeholder="Comma separated" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="processing_time_days" className="text-right">
              Processing Time (Days)
            </Label>
            <Input 
              type="text" 
              id="processing_time_days" 
              name="processing_time_days"
              value={formData.processing_time_days} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="eligibility_criteria" className="text-right">
              Eligibility Criteria
            </Label>
            <Textarea 
              id="eligibility_criteria" 
              name="eligibility_criteria"
              value={formData.eligibility_criteria} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="form_template_url" className="text-right">
              Form Template URL
            </Label>
            <Input 
              type="text" 
              id="form_template_url" 
              name="form_template_url"
              value={formData.form_template_url} 
              onChange={onInputChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={formData.status} onValueChange={onStatusChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" onClick={onSubmit}>
          {isEditing ? 'Update Service' : 'Create Service'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
