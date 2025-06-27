
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Scan, Ticket, ArrowRight, QrCode, History } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { tokenService } from '@/services/tokenService';
import QRCodeIDCardGenerator from './QRCodeIDCardGenerator';
import QRCodeScanner from './QRCodeScanner';
import VisitHistoryViewer from './VisitHistoryViewer';
import { PublicUserForm } from '../public-accounts/PublicUserForm';

const EnhancedPublicRegistryFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'select' | 'create-account' | 'generate-id' | 'registry' | 'scan' | 'history'>('select');
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [registryForm, setRegistryForm] = useState({
    purpose_of_visit: '',
    remarks: '',
    department_id: '',
    division_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const [depts, divs] = await Promise.all([
        apiService.getDepartments(),
        apiService.getDivisions()
      ]);
      setDepartments(depts);
      setDivisions(divs);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleCreateAccount = async (userData: any) => {
    try {
      const result = await apiService.createPublicUser(userData);
      setCreatedUser(result);
      setCurrentStep('generate-id');
      toast({
        title: "Success",
        description: `Public account created with ID: ${result.public_id}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  const handleProceedToRegistry = () => {
    setSelectedUser(createdUser);
    setCurrentStep('registry');
  };

  const handleUserScanned = (user: any) => {
    setSelectedUser(user);
    setCurrentStep('registry');
  };

  const handleRegistrySubmit = async () => {
    try {
      if (!registryForm.purpose_of_visit || !registryForm.department_id) {
        toast({
          title: "Validation Error",
          description: "Please fill in purpose of visit and select department",
          variant: "destructive",
        });
        return;
      }

      // Create registry entry
      const registryData = {
        public_user_id: selectedUser.id,
        visitor_name: selectedUser.name,
        visitor_nic: selectedUser.nic,
        visitor_address: selectedUser.address,
        visitor_phone: selectedUser.mobile,
        department_id: parseInt(registryForm.department_id),
        division_id: registryForm.division_id ? parseInt(registryForm.division_id) : undefined,
        purpose_of_visit: registryForm.purpose_of_visit,
        remarks: registryForm.remarks,
        visitor_type: 'existing'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/registry/index.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(registryData)
      });

      if (!response.ok) throw new Error('Failed to create registry entry');
      const registryResult = await response.json();

      // Generate token
      const tokenData = await tokenService.generateToken({
        registry_id: registryResult.data.id,
        department_id: parseInt(registryForm.department_id),
        division_id: registryForm.division_id ? parseInt(registryForm.division_id) : undefined,
        public_user_id: selectedUser.id,
        service_type: 'General Service',
        priority_level: 'normal'
      });

      toast({
        title: "Success",
        description: `Registry entry created and token ${tokenData.token_number} generated`,
      });

      // Reset form
      setRegistryForm({
        purpose_of_visit: '',
        remarks: '',
        department_id: '',
        division_id: ''
      });
      setSelectedUser(null);
      setCurrentStep('select');

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete registry process",
        variant: "destructive",
      });
    }
  };

  const filteredDivisions = divisions.filter((div: any) => 
    div.department_id === parseInt(registryForm.department_id)
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'select':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Public Registry Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => setCurrentStep('create-account')}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <UserPlus className="w-8 h-8" />
                  <span>Create New Account</span>
                </Button>
                
                <Button
                  onClick={() => setCurrentStep('scan')}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <Scan className="w-8 h-8" />
                  <span>Scan Existing ID</span>
                </Button>
                
                <Button
                  onClick={() => setCurrentStep('scan')}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <QrCode className="w-8 h-8" />
                  <span>Generate Token</span>
                </Button>
                
                <Button
                  onClick={() => setCurrentStep('history')}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <History className="w-8 h-8" />
                  <span>View History</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'create-account':
        return (
          <div>
            <Button onClick={() => setCurrentStep('select')} variant="outline" className="mb-4">
              ← Back
            </Button>
            <PublicUserForm
              user={null}
              onSubmit={handleCreateAccount}
              onClose={() => setCurrentStep('select')}
              isLoading={false}
            />
          </div>
        );

      case 'generate-id':
        return (
          <div>
            <Button onClick={() => setCurrentStep('select')} variant="outline" className="mb-4">
              ← Back
            </Button>
            <QRCodeIDCardGenerator
              user={createdUser}
              onProceedToRegistry={handleProceedToRegistry}
            />
          </div>
        );

      case 'scan':
        return (
          <div>
            <Button onClick={() => setCurrentStep('select')} variant="outline" className="mb-4">
              ← Back
            </Button>
            <QRCodeScanner
              onUserScanned={handleUserScanned}
              onClose={() => setCurrentStep('select')}
            />
          </div>
        );

      case 'registry':
        return (
          <div>
            <Button onClick={() => setCurrentStep('select')} variant="outline" className="mb-4">
              ← Back
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Registry Entry - {selectedUser?.name}</CardTitle>
                <p className="text-sm text-gray-600">
                  Public ID: {selectedUser?.public_id} | NIC: {selectedUser?.nic}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select value={registryForm.department_id} onValueChange={(value) => setRegistryForm(prev => ({ ...prev, department_id: value, division_id: '' }))}>
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="division">Division</Label>
                    <Select value={registryForm.division_id} onValueChange={(value) => setRegistryForm(prev => ({ ...prev, division_id: value }))}>
                      <SelectTrigger id="division">
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDivisions.map((div: any) => (
                          <SelectItem key={div.id} value={div.id.toString()}>
                            {div.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Visit *</Label>
                  <Input
                    id="purpose"
                    placeholder="Enter purpose of visit"
                    value={registryForm.purpose_of_visit}
                    onChange={(e) => setRegistryForm(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Enter any additional remarks"
                    value={registryForm.remarks}
                    onChange={(e) => setRegistryForm(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
                
                <Button onClick={handleRegistrySubmit} className="w-full">
                  <Ticket className="w-4 h-4 mr-2" />
                  Submit Entry & Generate Token
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'history':
        return (
          <div>
            <Button onClick={() => setCurrentStep('select')} variant="outline" className="mb-4">
              ← Back
            </Button>
            <QRCodeScanner
              onUserScanned={(user) => setSelectedUser(user)}
              onClose={() => setCurrentStep('select')}
            />
            {selectedUser && (
              <div className="mt-4">
                <VisitHistoryViewer
                  user={selectedUser}
                  onClose={() => setSelectedUser(null)}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      {renderCurrentStep()}
    </div>
  );
};

export default EnhancedPublicRegistryFlow;
