
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { registryApiService } from '@/services/registryApi';

export interface NewVisitorFormData {
  visitor_name: string;
  visitor_nic: string;
  visitor_address: string;
  visitor_phone: string;
  department_id: string;
  division_id: string;
  purpose_of_visit: string;
  remarks: string;
}

export interface ExistingVisitorFormData {
  public_user_id: number | null;
  visitor_name: string;
  visitor_nic: string;
  visitor_address: string;
  visitor_phone: string;
  department_id: string;
  division_id: string;
  purpose_of_visit: string;
  remarks: string;
}

const initialNewVisitorFormData: NewVisitorFormData = {
  visitor_name: '',
  visitor_nic: '',
  visitor_address: '',
  visitor_phone: '',
  department_id: '',
  division_id: '',
  purpose_of_visit: '',
  remarks: ''
};

const initialExistingVisitorFormData: ExistingVisitorFormData = {
  public_user_id: null,
  visitor_name: '',
  visitor_nic: '',
  visitor_address: '',
  visitor_phone: '',
  department_id: '',
  division_id: '',
  purpose_of_visit: '',
  remarks: ''
};

export const useRegistryForm = () => {
  const [newVisitorForm, setNewVisitorForm] = useState<NewVisitorFormData>(initialNewVisitorFormData);
  const [existingVisitorForm, setExistingVisitorForm] = useState<ExistingVisitorFormData>(initialExistingVisitorFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetNewVisitorForm = useCallback(() => {
    setNewVisitorForm(initialNewVisitorFormData);
  }, []);

  const resetExistingVisitorForm = useCallback(() => {
    setExistingVisitorForm(initialExistingVisitorFormData);
  }, []);

  const submitNewVisitor = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      const entryData = {
        visitor_name: newVisitorForm.visitor_name,
        visitor_nic: newVisitorForm.visitor_nic,
        visitor_address: newVisitorForm.visitor_address,
        visitor_phone: newVisitorForm.visitor_phone,
        department_id: parseInt(newVisitorForm.department_id),
        division_id: newVisitorForm.division_id ? parseInt(newVisitorForm.division_id) : undefined,
        purpose_of_visit: newVisitorForm.purpose_of_visit,
        remarks: newVisitorForm.remarks,
        visitor_type: 'new' as const
      };

      await registryApiService.createRegistryEntry(entryData);
      
      toast({
        title: "Success",
        description: "New visitor registered successfully",
      });
      
      resetNewVisitorForm();
      return true;
    } catch (error) {
      console.error('Error creating registry entry:', error);
      toast({
        title: "Error",
        description: "Failed to register visitor. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [newVisitorForm, toast, resetNewVisitorForm]);

  const submitExistingVisitor = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      const entryData = {
        public_user_id: existingVisitorForm.public_user_id,
        visitor_name: existingVisitorForm.visitor_name,
        visitor_nic: existingVisitorForm.visitor_nic,
        visitor_address: existingVisitorForm.visitor_address,
        visitor_phone: existingVisitorForm.visitor_phone,
        department_id: parseInt(existingVisitorForm.department_id),
        division_id: existingVisitorForm.division_id ? parseInt(existingVisitorForm.division_id) : undefined,
        purpose_of_visit: existingVisitorForm.purpose_of_visit,
        remarks: existingVisitorForm.remarks,
        visitor_type: 'existing' as const
      };

      await registryApiService.createRegistryEntry(entryData);
      
      toast({
        title: "Success",
        description: "Existing visitor registered successfully",
      });
      
      resetExistingVisitorForm();
      return true;
    } catch (error) {
      console.error('Error creating registry entry:', error);
      toast({
        title: "Error",
        description: "Failed to register visitor. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [existingVisitorForm, toast, resetExistingVisitorForm]);

  return {
    newVisitorForm,
    setNewVisitorForm,
    existingVisitorForm,
    setExistingVisitorForm,
    isSubmitting,
    submitNewVisitor,
    submitExistingVisitor,
    resetNewVisitorForm,
    resetExistingVisitorForm
  };
};
