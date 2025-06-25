import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

interface PublicRegistryFormProps {
  departments: import('@/services/apiService').Department[];
  divisions: import('@/services/apiService').Division[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PublicRegistryForm: React.FC<PublicRegistryFormProps> = ({
  departments,
  divisions,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [visitorType, setVisitorType] = useState<'new' | 'existing'>('new');
  const [visitorId, setVisitorId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorNIC, setVisitorNIC] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorAddress, setVisitorAddress] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState('');
  const [remarks, setRemarks] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (visitorType === 'existing') {
      setVisitorName('');
      setVisitorNIC('');
      setVisitorPhone('');
      setVisitorAddress('');
      setDepartmentId('');
      setDivisionId('');
      setPurposeOfVisit('');
      setRemarks('');
    }
  }, [visitorType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      visitor_id: visitorType === 'existing' ? parseInt(visitorId) : 0,
      visitor_name: visitorName,
      visitor_nic: visitorNIC,
      visitor_phone: visitorPhone,
      visitor_address: visitorAddress,
      department_id: parseInt(departmentId),
      department_name: departments.find(d => d.id === parseInt(departmentId))?.name || '',
      division_id: parseInt(divisionId),
      division_name: divisions.find(d => d.id === parseInt(divisionId))?.name || '',
      purpose_of_visit: purposeOfVisit,
      remarks: remarks,
    };

    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center text-blue-800">
          Public Visitor Registry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Label className="text-sm font-medium">Select Visitor Type:</Label>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="new-visitor"
                name="visitorType"
                checked={visitorType === 'new'}
                onChange={() => setVisitorType('new')}
              />
              <Label htmlFor="new-visitor">● New Visitor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="existing-visitor"
                name="visitorType"
                checked={visitorType === 'existing'}
                onChange={() => setVisitorType('existing')}
              />
              <Label htmlFor="existing-visitor">○ Existing ID</Label>
            </div>
          </div>
        </div>

        {visitorType === 'existing' ? (
          <div className="space-y-4">
            <Label htmlFor="visitorId">Enter Visitor ID:</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                id="visitorId"
                placeholder="Search by ID..."
                value={visitorId}
                onChange={(e) => setVisitorId(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visitorName">Visitor Name:</Label>
              <Input
                type="text"
                id="visitorName"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="visitorNIC">Visitor NIC:</Label>
              <Input
                type="text"
                id="visitorNIC"
                value={visitorNIC}
                onChange={(e) => setVisitorNIC(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="visitorPhone">Visitor Phone:</Label>
              <Input
                type="text"
                id="visitorPhone"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="visitorAddress">Visitor Address:</Label>
              <Input
                type="text"
                id="visitorAddress"
                value={visitorAddress}
                onChange={(e) => setVisitorAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="departmentId">Department:</Label>
            <Select value={departmentId} onValueChange={(value) => setDepartmentId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id.toString()}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="divisionId">Division:</Label>
            <Select value={divisionId} onValueChange={(value) => setDivisionId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((division) => (
                  <SelectItem key={division.id} value={division.id.toString()}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="purposeOfVisit">Purpose of Visit:</Label>
          <Textarea
            id="purposeOfVisit"
            placeholder="Enter purpose of visit..."
            value={purposeOfVisit}
            onChange={(e) => setPurposeOfVisit(e.target.value)}
            className="resize-none"
          />
        </div>

        <div>
          <Label htmlFor="remarks">Remarks:</Label>
          <Textarea
            id="remarks"
            placeholder="Enter remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="resize-none"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicRegistryForm;
