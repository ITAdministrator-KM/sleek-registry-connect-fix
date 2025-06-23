import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, UserPlus } from 'lucide-react';

// Define interfaces for our data structures
export interface Department {
  id: string;
  name: string;
}

interface Division {
  id: string;
  name: string;
  department_id: string;
}

// Form validation schemas
const newVisitorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  nic: z.string().min(10, 'NIC must be at least 10 characters'),
  address: z.string().min(5, 'Address is required'),
  mobile: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional(),
  department_id: z.string().min(1, 'Department is required'),
  division_id: z.string().optional(),
  purpose: z.string().min(10, 'Purpose of visit is required'),
  remarks: z.string().optional(),
  create_account: z.boolean().default(true)
});

const existingVisitorSchema = z.object({
  search: z.string().min(1, 'Search query is required'),
  public_user_id: z.string().min(1, 'Please select a visitor'),
  purpose: z.string().min(10, 'Purpose of visit is required'),
  remarks: z.string().optional()
});

type NewVisitorFormData = z.infer<typeof newVisitorSchema>;
type ExistingVisitorFormData = z.infer<typeof existingVisitorSchema>;

interface PublicRegistryFormProps {
  departments: Department[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PublicRegistryForm: React.FC<PublicRegistryFormProps> = ({
  departments: initialDepartments = [],
  onSuccess,
  onCancel
}) => {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(initialDepartments.length === 0);
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch departments if not provided
  useEffect(() => {
    const fetchDepartments = async () => {
      if (departments.length === 0) {
        try {
          setIsLoadingDepartments(true);
          const response = await fetch('https://dskalmunai.lk/backend/api/departments/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setDepartments(data.data || []);
          } else {
            throw new Error('Failed to fetch departments');
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
          toast({
            title: 'Error',
            description: 'Failed to load departments. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingDepartments(false);
        }
      }
    };

    fetchDepartments();
  }, [departments.length, toast]);

  // New visitor form
  const newVisitorForm = useForm<NewVisitorFormData>({
    resolver: zodResolver(newVisitorSchema),
    defaultValues: {
      create_account: true
    }
  });

  // Existing visitor form
  const existingVisitorForm = useForm<ExistingVisitorFormData>({
    resolver: zodResolver(existingVisitorSchema)
  });

  // Watch department ID to load divisions
  const selectedDepartmentId = newVisitorForm.watch('department_id');

  // Load divisions when department changes
  React.useEffect(() => {
    const loadDivisions = async () => {
      if (!selectedDepartmentId) {
        setDivisions([]);
        return;
      }
      
      try {
        // Replace with your actual API call to get divisions
        const response = await fetch(`/api/departments/${selectedDepartmentId}/divisions`);
        if (response.ok) {
          const data = await response.json();
          setDivisions(data);
        }
      } catch (error) {
        console.error('Error loading divisions:', error);
      }
    };

    loadDivisions();
  }, [selectedDepartmentId]);

  // Handle new visitor submission
  const handleNewVisitor = async (data: NewVisitorFormData) => {
    setIsSubmitting(true);
    try {
      // Replace with your actual API call to create a new visitor
      const response = await fetch('/api/public/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to register visitor');
      }

      toast({
        title: 'Success',
        description: 'Visitor registered successfully',
      });

      // Reset form and call success callback
      newVisitorForm.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error registering visitor:', error);
      toast({
        title: 'Error',
        description: 'Failed to register visitor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle existing visitor submission
  const handleExistingVisitor = async (data: ExistingVisitorFormData) => {
    setIsSubmitting(true);
    try {
      // Replace with your actual API call to record a visit
      const response = await fetch('/api/public/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_user_id: data.public_user_id,
          purpose: data.purpose,
          remarks: data.remarks
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record visit');
      }

      toast({
        title: 'Success',
        description: 'Visit recorded successfully',
      });

      // Reset form and call success callback
      existingVisitorForm.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error recording visit:', error);
      toast({
        title: 'Error',
        description: 'Failed to record visit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Public Visitor Registry</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'new' | 'existing')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">
              <UserPlus className="mr-2 h-4 w-4" />
              New Visitor
            </TabsTrigger>
            <TabsTrigger value="existing">
              <User className="mr-2 h-4 w-4" />
              Existing Visitor
            </TabsTrigger>
          </TabsList>

          {/* New Visitor Tab */}
          <TabsContent value="new" className="mt-6">
            <form onSubmit={newVisitorForm.handleSubmit(handleNewVisitor)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    {...newVisitorForm.register('name')}
                    className={newVisitorForm.formState.errors.name ? 'border-red-500' : ''}
                  />
                  {newVisitorForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {newVisitorForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nic">NIC/Passport *</Label>
                  <Input
                    id="nic"
                    placeholder="Enter NIC or Passport number"
                    {...newVisitorForm.register('nic')}
                    className={newVisitorForm.formState.errors.nic ? 'border-red-500' : ''}
                  />
                  {newVisitorForm.formState.errors.nic && (
                    <p className="text-sm text-red-500">
                      {newVisitorForm.formState.errors.nic.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Phone Number *</Label>
                  <Input
                    id="mobile"
                    placeholder="Enter phone number"
                    {...newVisitorForm.register('mobile')}
                    className={newVisitorForm.formState.errors.mobile ? 'border-red-500' : ''}
                  />
                  {newVisitorForm.formState.errors.mobile && (
                    <p className="text-sm text-red-500">
                      {newVisitorForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    {...newVisitorForm.register('email')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="Enter address"
                  {...newVisitorForm.register('address')}
                  className={newVisitorForm.formState.errors.address ? 'border-red-500' : ''}
                />
                {newVisitorForm.formState.errors.address && (
                  <p className="text-sm text-red-500">
                    {newVisitorForm.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department_id">Department *</Label>
                  <Select
                    onValueChange={(value) => {
                      newVisitorForm.setValue('department_id', value);
                      newVisitorForm.setValue('division_id', '');
                    }}
                    value={newVisitorForm.watch('department_id') || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newVisitorForm.formState.errors.department_id && (
                    <p className="text-sm text-red-500">
                      {newVisitorForm.formState.errors.department_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="division_id">Division (Optional)</Label>
                  <Select
                    onValueChange={(value) => newVisitorForm.setValue('division_id', value)}
                    value={newVisitorForm.watch('division_id') || ''}
                    disabled={!selectedDepartmentId || divisions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={divisions.length ? 'Select division' : 'Select department first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((div) => (
                        <SelectItem key={div.id} value={div.id}>
                          {div.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Briefly describe the purpose of your visit"
                  rows={3}
                  {...newVisitorForm.register('purpose')}
                  className={newVisitorForm.formState.errors.purpose ? 'border-red-500' : ''}
                />
                {newVisitorForm.formState.errors.purpose && (
                  <p className="text-sm text-red-500">
                    {newVisitorForm.formState.errors.purpose.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any additional information"
                  rows={2}
                  {...newVisitorForm.register('remarks')}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="create_account"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...newVisitorForm.register('create_account')}
                />
                <Label htmlFor="create_account" className="text-sm font-medium text-gray-700">
                  Create a public user account for future visits
                </Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Visitor'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Existing Visitor Tab */}
          <TabsContent value="existing" className="mt-6">
            <form onSubmit={existingVisitorForm.handleSubmit(handleExistingVisitor)} className="space-y-4">
              <div className="space-y-2">
                <Label>Search by Name, NIC, or ID</Label>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Search visitors..." 
                    {...existingVisitorForm.register('search')} 
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
                {existingVisitorForm.formState.errors.search && (
                  <p className="text-sm text-red-500">
                    {existingVisitorForm.formState.errors.search.message}
                  </p>
                )}
              </div>

              {/* Search results would be displayed here */}
              
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Briefly describe the purpose of your visit"
                  rows={3}
                  {...existingVisitorForm.register('purpose')}
                  className={existingVisitorForm.formState.errors.purpose ? 'border-red-500' : ''}
                />
                {existingVisitorForm.formState.errors.purpose && (
                  <p className="text-sm text-red-500">
                    {existingVisitorForm.formState.errors.purpose.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any additional information"
                  rows={2}
                  {...existingVisitorForm.register('remarks')}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    'Check In Visitor'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
