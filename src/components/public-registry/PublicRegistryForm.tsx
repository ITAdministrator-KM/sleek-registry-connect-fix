import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Search, User, UserPlus } from 'lucide-react';
import { registryApiService } from '@/services/registryApi';
import { apiService, Department, Division } from '@/services/apiService';
import type { PublicRegistryFormProps } from './types';

export const PublicRegistryForm: React.FC<PublicRegistryFormProps> = ({
  onSuccess,
  onCancel,
  defaultTab = 'new',
  initialValues,
  departments: propDepartments = []
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [departments, setDepartments] = useState<Department[]>(propDepartments);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // New visitor form state
  const [newVisitorForm, setNewVisitorForm] = useState({
    visitor_name: initialValues?.newVisitor?.name || '',
    visitor_nic: initialValues?.newVisitor?.nic || '',
    visitor_address: initialValues?.newVisitor?.address || '',
    visitor_phone: initialValues?.newVisitor?.phone || '',
    department_id: initialValues?.newVisitor?.department_id || '',
    division_id: initialValues?.newVisitor?.division_id || '',
    purpose_of_visit: initialValues?.newVisitor?.purpose || '',
    remarks: initialValues?.newVisitor?.remarks || ''
  });

  // Existing visitor form state
  const [existingVisitorForm, setExistingVisitorForm] = useState({
    public_user_id: null as number | null,
    visitor_name: '',
    visitor_nic: '',
    visitor_address: '',
    visitor_phone: '',
    department_id: '',
    division_id: '',
    purpose_of_visit: initialValues?.existingVisitor?.purpose || '',
    remarks: initialValues?.existingVisitor?.remarks || ''
  });

  useEffect(() => {
    if (propDepartments.length === 0) {
      fetchDepartments();
    }
  }, [propDepartments]);

  const fetchDepartments = async () => {
    try {
      const departmentsData = await apiService.getDepartments();
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      });
    }
  };

  const fetchDivisions = async (departmentId: number) => {
    try {
      const divisionsData = await apiService.getDivisions(departmentId);
      setDivisions(divisionsData);
    } catch (error) {
      console.error('Error fetching divisions:', error);
      toast({
        title: "Error",
        description: "Failed to load divisions",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentChange = (departmentId: string, isNewVisitor: boolean = true) => {
    const deptId = parseInt(departmentId);
    
    if (isNewVisitor) {
      setNewVisitorForm(prev => ({
        ...prev,
        department_id: departmentId,
        division_id: ''
      }));
    } else {
      setExistingVisitorForm(prev => ({
        ...prev,
        department_id: departmentId,
        division_id: ''
      }));
    }
    
    if (departmentId) {
      fetchDivisions(deptId);
    }
  };

  const handleNewVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVisitorForm.visitor_name || !newVisitorForm.visitor_nic || !newVisitorForm.department_id || !newVisitorForm.purpose_of_visit) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

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
        visitor_type: 'new' as const,
        status: 'active' as const
      };

      console.log('Submitting new visitor data:', entryData);
      const result = await registryApiService.createRegistryEntry(entryData);
      console.log('Registry entry created:', result);
      
      toast({
        title: "Success",
        description: "New visitor registered successfully",
      });
      
      // Reset form
      setNewVisitorForm({
        visitor_name: '',
        visitor_nic: '',
        visitor_address: '',
        visitor_phone: '',
        department_id: '',
        division_id: '',
        purpose_of_visit: '',
        remarks: ''
      });
      
      onSuccess?.();
      
    } catch (error) {
      console.error('Error creating registry entry:', error);
      toast({
        title: "Error",
        description: "Failed to register visitor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExistingVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!existingVisitorForm.visitor_name || !existingVisitorForm.department_id || !existingVisitorForm.purpose_of_visit) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

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
        visitor_type: 'existing' as const,
        status: 'active' as const
      };

      console.log('Submitting existing visitor data:', entryData);
      const result = await registryApiService.createRegistryEntry(entryData);
      console.log('Registry entry created:', result);
      
      toast({
        title: "Success",
        description: "Existing visitor registered successfully",
      });
      
      // Reset form
      setExistingVisitorForm({
        public_user_id: null,
        visitor_name: '',
        visitor_nic: '',
        visitor_address: '',
        visitor_phone: '',
        department_id: '',
        division_id: '',
        purpose_of_visit: '',
        remarks: ''
      });
      
      onSuccess?.();
      
    } catch (error) {
      console.error('Error creating registry entry:', error);
      toast({
        title: "Error",
        description: "Failed to register visitor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Public Visitor Registry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              New Visitor
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Existing ID
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4 mt-6">
            <form onSubmit={handleNewVisitorSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-visitor-name">Full Name *</Label>
                  <Input
                    id="new-visitor-name"
                    name="visitor_name"
                    type="text"
                    placeholder="Enter full name"
                    value={newVisitorForm.visitor_name}
                    onChange={(e) => setNewVisitorForm(prev => ({ ...prev, visitor_name: e.target.value }))}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-visitor-nic">NIC Number *</Label>
                  <Input
                    id="new-visitor-nic"
                    name="visitor_nic"
                    type="text"
                    placeholder="Enter NIC number"
                    value={newVisitorForm.visitor_nic}
                    onChange={(e) => setNewVisitorForm(prev => ({ ...prev, visitor_nic: e.target.value }))}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-visitor-address">Address</Label>
                <Textarea
                  id="new-visitor-address"
                  name="visitor_address"
                  placeholder="Enter full address"
                  value={newVisitorForm.visitor_address}
                  onChange={(e) => setNewVisitorForm(prev => ({ ...prev, visitor_address: e.target.value }))}
                  autoComplete="street-address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-visitor-department">Department *</Label>
                  <Select 
                    value={newVisitorForm.department_id} 
                    onValueChange={(value) => handleDepartmentChange(value, true)}
                    required
                  >
                    <SelectTrigger id="new-visitor-department">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-visitor-phone">Phone (optional)</Label>
                  <Input
                    id="new-visitor-phone"
                    name="visitor_phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={newVisitorForm.visitor_phone}
                    onChange={(e) => setNewVisitorForm(prev => ({ ...prev, visitor_phone: e.target.value }))}
                    autoComplete="tel"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-visitor-purpose">Purpose of Visit *</Label>
                <Input
                  id="new-visitor-purpose"
                  name="purpose_of_visit"
                  type="text"
                  placeholder="Enter purpose of visit"
                  value={newVisitorForm.purpose_of_visit}
                  onChange={(e) => setNewVisitorForm(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-visitor-remarks">Remarks</Label>
                <Textarea
                  id="new-visitor-remarks"
                  name="remarks"
                  placeholder="Enter any additional remarks"
                  value={newVisitorForm.remarks}
                  onChange={(e) => setNewVisitorForm(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Register New Visitor'}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="existing" className="space-y-4 mt-6">
            <div className="flex gap-2 mb-4">
              <Button type="button" variant="outline" className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Scan QR Code
              </Button>
              <Input
                placeholder="Or enter Public ID"
                className="flex-1"
              />
            </div>
            
            <form onSubmit={handleExistingVisitorSubmit} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Auto-filled fields:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label htmlFor="existing-visitor-name">Name:</Label>
                    <Input
                      id="existing-visitor-name"
                      name="visitor_name"
                      type="text"
                      value={existingVisitorForm.visitor_name}
                      onChange={(e) => setExistingVisitorForm(prev => ({ ...prev, visitor_name: e.target.value }))}
                      placeholder="Auto-filled from scan"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="existing-visitor-nic-display">NIC:</Label>
                    <Input
                      id="existing-visitor-nic-display"
                      type="text"
                      value={existingVisitorForm.visitor_nic}
                      readOnly
                      placeholder="**********"
                    />
                  </div>
                  <div>
                    <Label htmlFor="existing-visitor-department-display">Department:</Label>
                    <Select 
                      value={existingVisitorForm.department_id} 
                      onValueChange={(value) => handleDepartmentChange(value, false)}
                    >
                      <SelectTrigger id="existing-visitor-department-display">
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
                  </div>
                  <div>
                    <Label htmlFor="existing-visitor-address-display">Address:</Label>
                    <Input
                      id="existing-visitor-address-display"
                      type="text"
                      value={existingVisitorForm.visitor_address}
                      readOnly
                      placeholder="Auto-filled address"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="existing-visitor-purpose">Purpose of Visit *</Label>
                <Input
                  id="existing-visitor-purpose"
                  name="purpose_of_visit"
                  type="text"
                  placeholder="Enter purpose of visit"
                  value={existingVisitorForm.purpose_of_visit}
                  onChange={(e) => setExistingVisitorForm(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="existing-visitor-remarks">Remarks (optional)</Label>
                <Textarea
                  id="existing-visitor-remarks"
                  name="remarks"
                  placeholder="Enter any additional remarks"
                  value={existingVisitorForm.remarks}
                  onChange={(e) => setExistingVisitorForm(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
