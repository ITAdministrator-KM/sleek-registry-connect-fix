import { useState, useCallback } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { publicRegistryService, PublicVisitor, RegistryEntry } from '@/services/publicRegistryService';
import { NewVisitorFormData, ExistingVisitorFormData } from '@/lib/validations/registryValidations';

interface UseRegistryFormProps {
  onSuccess?: (data: PublicVisitor | RegistryEntry) => void;
  onError?: (error: Error) => void;
}

export const useRegistryForm = ({ onSuccess, onError }: UseRegistryFormProps = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');

  // New visitor form
  const newVisitorForm = useForm<NewVisitorFormData>({
    resolver: zodResolver(NewVisitorFormData),
    defaultValues: {
      create_account: true,
    },
  });

  // Existing visitor form
  const existingVisitorForm = useForm<ExistingVisitorFormData>({
    resolver: zodResolver(ExistingVisitorFormData),
  });

  // Handle new visitor submission
  const handleNewVisitor = useCallback(
    async (data: NewVisitorFormData) => {
      setIsSubmitting(true);
      
      try {
        // Prepare visitor data
        const visitorData = {
          name: data.name,
          nic: data.nic,
          address: data.address,
          mobile: data.mobile,
          email: data.email || undefined,
          department_id: parseInt(data.department_id, 10),
          division_id: data.division_id ? parseInt(data.division_id, 10) : undefined,
          status: 'active' as const,
        };

        // Create visitor if needed
        let visitor: PublicVisitor | null = null;
        if (data.create_account) {
          visitor = await publicRegistryService.createVisitor(visitorData);
        }

        // Create registry entry
        const entryData = {
          visitor_name: data.name,
          visitor_nic: data.nic,
          visitor_address: data.address,
          visitor_phone: data.mobile,
          department_id: parseInt(data.department_id, 10),
          division_id: data.division_id ? parseInt(data.division_id, 10) : undefined,
          purpose_of_visit: data.purpose,
          remarks: data.remarks || undefined,
          visitor_type: 'new' as const,
          ...(visitor && { public_user_id: visitor.id }),
        };

        const entry = await publicRegistryService.createRegistryEntry(entryData);

        // Show success message
        toast({
          title: 'Success',
          description: data.create_account
            ? 'Visitor registered and account created successfully!'
            : 'Visitor registered successfully!',
          variant: 'default',
        });

        // Reset form and call success callback
        newVisitorForm.reset();
        onSuccess?.(entry);
        return entry;
      } catch (error) {
        console.error('Error registering visitor:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to register visitor';
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [newVisitorForm, onSuccess, onError]
  );

  // Handle existing visitor submission
  const handleExistingVisitor = useCallback(
    async (data: ExistingVisitorFormData) => {
      setIsSubmitting(true);
      
      try {
        // Get visitor details
        const visitor = await publicRegistryService.getVisitorById(parseInt(data.public_user_id, 10));
        
        if (!visitor) {
          throw new Error('Visitor not found');
        }

        // Create registry entry
        const entryData = {
          public_user_id: visitor.id,
          visitor_name: visitor.name,
          visitor_nic: visitor.nic,
          visitor_address: visitor.address,
          visitor_phone: visitor.mobile,
          department_id: visitor.department_id || 1, // Default department if not set
          division_id: visitor.division_id,
          purpose_of_visit: data.purpose,
          remarks: data.remarks || undefined,
          visitor_type: 'existing' as const,
        };

        const entry = await publicRegistryService.createRegistryEntry(entryData);

        // Show success message
        toast({
          title: 'Success',
          description: 'Visitor check-in recorded successfully!',
          variant: 'default',
        });

        // Reset form and call success callback
        existingVisitorForm.reset();
        onSuccess?.(entry);
        return entry;
      } catch (error) {
        console.error('Error recording visit:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to record visit';
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [existingVisitorForm, onSuccess, onError]
  );

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as 'new' | 'existing');
  }, []);

  return {
    // Form state
    isSubmitting,
    activeTab,
    handleTabChange,
    
    // New visitor form
    newVisitorForm,
    handleNewVisitor,
    
    // Existing visitor form
    existingVisitorForm,
    handleExistingVisitor,
  };
};
