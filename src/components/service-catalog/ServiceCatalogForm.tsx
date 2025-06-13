
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department_id: number;
}

interface ServiceCatalogFormProps {
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  departments: Department[];
  divisions: Division[];
  editingService?: any;
}

const ServiceCatalogForm = ({ onSubmit, onCancel, departments, divisions, editingService }: ServiceCatalogFormProps) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: editingService ? {
      service_name: editingService.service_name,
      service_code: editingService.service_code,
      description: editingService.description,
      department_id: editingService.department_id?.toString(),
      division_id: editingService.division_id?.toString() || '',
      icon: editingService.icon,
      fee_amount: editingService.fee_amount,
      required_documents: Array.isArray(editingService.required_documents) 
        ? editingService.required_documents.join(', ')
        : editingService.required_documents || '',
      processing_time_days: editingService.processing_time_days,
      eligibility_criteria: editingService.eligibility_criteria || '',
      form_template_url: editingService.form_template_url || '',
      status: editingService.status
    } : {}
  });

  const selectedDepartmentId = watch('department_id');
  const filteredDivisions = divisions.filter(d => 
    selectedDepartmentId ? d.department_id === parseInt(selectedDepartmentId) : false
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
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
              setValue('division_id', '');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50 max-h-48 overflow-y-auto">
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
            <SelectContent className="bg-white border shadow-lg z-50 max-h-48 overflow-y-auto">
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

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {editingService ? 'Update' : 'Create'} Service
        </Button>
      </div>
    </form>
  );
};

export default ServiceCatalogForm;
