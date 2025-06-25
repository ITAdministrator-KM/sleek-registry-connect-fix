
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/apiService';
import { ArrowRight, User, CreditCard, FileText } from 'lucide-react';

interface NewPublicEntryFlowProps {
  departments: any[];
  divisions: any[];
  onComplete: (result: any) => void;
}

const NewPublicEntryFlow: React.FC<NewPublicEntryFlowProps> = ({
  departments,
  divisions,
  onComplete
}) => {
  const [step, setStep] = useState<'account' | 'id-card' | 'registry'>('account');
  const [loading, setLoading] = useState(false);
  const [publicUser, setPublicUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    mobile: '',
    address: '',
    email: '',
    department_id: '',
    division_id: '',
    purpose_of_visit: '',
    remarks: ''
  });
  const { toast } = useToast();

  const handleAccountCreation = async () => {
    if (!formData.name || !formData.nic || !formData.mobile) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newUser = await apiService.createPublicUser({
        name: formData.name,
        nic: formData.nic,
        mobile: formData.mobile,
        address: formData.address,
        email: formData.email,
        status: 'active' as const
      });

      setPublicUser(newUser);
      setStep('id-card');
      
      toast({
        title: "Account Created",
        description: `Public ID: ${newUser.public_id}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIDCardGenerated = () => {
    setStep('registry');
    toast({
      title: "ID Card Generated",
      description: "Proceeding to registry entry",
    });
  };

  const handleRegistryEntry = async () => {
    if (!formData.department_id || !formData.purpose_of_visit) {
      toast({
        title: "Validation Error",
        description: "Please select department and enter purpose",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create registry entry and token
      const result = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/registry/create-entry.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          visitor_id: publicUser.id,
          visitor_name: publicUser.name,
          visitor_nic: publicUser.nic,
          visitor_phone: publicUser.mobile,
          visitor_address: publicUser.address,
          department_id: formData.department_id,
          division_id: formData.division_id,
          purpose_of_visit: formData.purpose_of_visit,
          remarks: formData.remarks,
          entry_time: new Date().toISOString(),
          status: 'active'
        })
      });

      if (result.ok) {
        const registryData = await result.json();
        onComplete({
          type: 'new-entry',
          publicUser,
          registryData,
          autoGenerateToken: true
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create registry entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'account':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Step 1: Create Public Account</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nic">NIC Number *</Label>
                <Input
                  id="nic"
                  name="nic"
                  autoComplete="off"
                  value={formData.nic}
                  onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  autoComplete="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                autoComplete="street-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            
            <Button onClick={handleAccountCreation} disabled={loading} className="w-full">
              {loading ? 'Creating Account...' : 'Create Account & Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'id-card':
        return (
          <div className="space-y-4 text-center">
            <div className="flex items-center gap-2 justify-center mb-4">
              <CreditCard className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Step 2: Generate ID Card</h3>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-800 mb-4">
                Account created successfully for <strong>{publicUser?.name}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Public ID: <strong>{publicUser?.public_id}</strong>
              </p>
              <Button onClick={handleIDCardGenerated} className="bg-green-600 hover:bg-green-700">
                Generate ID Card & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'registry':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Step 3: Registry Entry</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.department_id} onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select Department" />
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
                <Label htmlFor="division">Division</Label>
                <Select value={formData.division_id} onValueChange={(value) => setFormData(prev => ({ ...prev, division_id: value }))}>
                  <SelectTrigger id="division">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((div) => (
                      <SelectItem key={div.id} value={div.id.toString()}>
                        {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="purpose">Purpose of Visit *</Label>
              <Input
                id="purpose"
                name="purpose"
                autoComplete="off"
                value={formData.purpose_of_visit}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                name="remarks"
                autoComplete="off"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              />
            </div>
            
            <Button onClick={handleRegistryEntry} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
              {loading ? 'Creating Entry...' : 'Complete Entry & Generate Token'}
            </Button>
          </div>
        );
    }
  };

  return renderStep();
};

export default NewPublicEntryFlow;
