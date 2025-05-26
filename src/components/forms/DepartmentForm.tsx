
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DepartmentFormProps {
  department?: {
    id: string;
    name: string;
    description: string;
  } | null;
  onSubmit: (data: { name: string; description: string }) => void;
  onCancel: () => void;
}

const DepartmentForm = ({ department, onSubmit, onCancel }: DepartmentFormProps) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Department description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Uploaded",
        description: `${file.name} uploaded successfully`,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="dept-name" className="text-gray-700 font-medium">
          Department Name <span className="text-red-500" aria-label="required">*</span>
        </Label>
        <Input
          id="dept-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name) {
              setErrors(prev => ({ ...prev, name: '' }));
            }
          }}
          placeholder="Enter department name"
          required
          aria-required="true"
          aria-describedby={errors.name ? "name-error" : "name-help"}
          aria-invalid={!!errors.name}
        />
        <small id="name-help" className="text-sm text-gray-500">
          Enter a unique name for the department
        </small>
        {errors.name && (
          <div id="name-error" className="text-sm text-red-600" role="alert">
            {errors.name}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="dept-description" className="text-gray-700 font-medium">
          Description <span className="text-red-500" aria-label="required">*</span>
        </Label>
        <Textarea
          id="dept-description"
          name="description"
          value={formData.description}
          onChange={(e) => {
            setFormData({ ...formData, description: e.target.value });
            if (errors.description) {
              setErrors(prev => ({ ...prev, description: '' }));
            }
          }}
          placeholder="Enter department description"
          rows={4}
          required
          aria-required="true"
          aria-describedby={errors.description ? "description-error" : "description-help"}
          aria-invalid={!!errors.description}
        />
        <small id="description-help" className="text-sm text-gray-500">
          Provide a detailed description of the department's role
        </small>
        {errors.description && (
          <div id="description-error" className="text-sm text-red-600" role="alert">
            {errors.description}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dept-documents" className="text-gray-700 font-medium">
          Upload Documents (Optional)
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            id="dept-documents"
            name="documents"
            type="file"
            onChange={handleFileUpload}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            aria-describedby="documents-help"
          />
          <Upload className="text-gray-400" size={20} aria-hidden="true" />
        </div>
        <small id="documents-help" className="text-sm text-gray-500">
          Upload relevant documents (PDF, DOC, DOCX, TXT)
        </small>
      </div>
      
      <div className="flex space-x-3">
        <Button 
          type="submit" 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {department ? 'Update' : 'Create'} Department
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default DepartmentForm;
