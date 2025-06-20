import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Camera, FileText, Plus, Search, Download, RefreshCw, User, UserPlus } from 'lucide-react';
import { registryApiService, type RegistryEntry, type RegistryEntryCreateData } from '@/services/registryApi';

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department_id: number;
}

const PublicRegistry: React.FC = () => {
  const [activeTab, setActiveTab] = useState('new-visitor');
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state for new visitor
  const [newVisitorForm, setNewVisitorForm] = useState({
    visitor_name: '',
    visitor_nic: '',
    visitor_address: '',
    visitor_phone: '',
    department_id: '',
    division_id: '',
    purpose_of_visit: '',
    remarks: ''
  });

  // Form state for existing visitor
  const [existingVisitorForm, setExistingVisitorForm] = useState({
    public_user_id: null as number | null,
    visitor_name: '',
    visitor_nic: '',
    visitor_address: '',
    visitor_phone: '',
    department_id: '',
    division_id: '',
    purpose_of_visit: '',
    remarks: ''
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRegistryEntries();
    fetchDepartments();
  }, []);

  const fetchRegistryEntries = async () => {
    try {
      setLoading(true);
      const entries = await registryApiService.getRegistryEntries({
        date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
      setRegistryEntries(entries);
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registry entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('https://dskalmunai.lk/backend/api/departments/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async (departmentId: number) => {
    try {
      const response = await fetch(`https://dskalmunai.lk/backend/api/divisions/?department_id=${departmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDivisions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching divisions:', error);
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
    
    fetchDivisions(deptId);
  };

  const handleNewVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVisitorForm.visitor_name || !newVisitorForm.visitor_nic || !newVisitorForm.department_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const entryData: RegistryEntryCreateData = {
        visitor_name: newVisitorForm.visitor_name,
        visitor_nic: newVisitorForm.visitor_nic,
        visitor_address: newVisitorForm.visitor_address,
        visitor_phone: newVisitorForm.visitor_phone,
        department_id: parseInt(newVisitorForm.department_id),
        division_id: newVisitorForm.division_id ? parseInt(newVisitorForm.division_id) : undefined,
        purpose_of_visit: newVisitorForm.purpose_of_visit,
        remarks: newVisitorForm.remarks,
        visitor_type: 'new'
      };

      await registryApiService.createRegistryEntry(entryData);
      
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
      
      // Refresh entries
      fetchRegistryEntries();
      
    } catch (error) {
      console.error('Error creating registry entry:', error);
      toast({
        title: "Error",
        description: "Failed to register visitor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExistingVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!existingVisitorForm.visitor_name || !existingVisitorForm.department_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const entryData: RegistryEntryCreateData = {
        public_user_id: existingVisitorForm.public_user_id,
        visitor_name: existingVisitorForm.visitor_name,
        visitor_nic: existingVisitorForm.visitor_nic,
        visitor_address: existingVisitorForm.visitor_address,
        visitor_phone: existingVisitorForm.visitor_phone,
        department_id: parseInt(existingVisitorForm.department_id),
        division_id: existingVisitorForm.division_id ? parseInt(existingVisitorForm.division_id) : undefined,
        purpose_of_visit: existingVisitorForm.purpose_of_visit,
        remarks: existingVisitorForm.remarks,
        visitor_type: 'existing'
      };

      await registryApiService.createRegistryEntry(entryData);
      
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
      
      // Refresh entries
      fetchRegistryEntries();
      
    } catch (error) {
      console.error('Error creating registry entry:', error);
      toast({
        title: "Error",
        description: "Failed to register visitor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    try {
      const blob = await registryApiService.exportRegistryData({
        date: new Date().toISOString().split('T')[0],
        format
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registry_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `Registry data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const filteredEntries = registryEntries.filter(entry =>
    entry.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.visitor_nic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Public Visitor Registry</h1>
        <div className="flex gap-2">
          <Button onClick={() => exportData('pdf')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchRegistryEntries} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Register New Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new-visitor" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  New Visitor
                </TabsTrigger>
                <TabsTrigger value="existing-id" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Existing ID
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new-visitor" className="space-y-4">
                <form onSubmit={handleNewVisitorSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-visitor-name">Full Name *</Label>
                      <Input
                        id="new-visitor-name"
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
                      placeholder="Enter any additional remarks"
                      value={newVisitorForm.remarks}
                      onChange={(e) => setNewVisitorForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Registering...' : 'Save Account & Proceed to Registry Entry'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="existing-id" className="space-y-4">
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
                      placeholder="Enter any additional remarks"
                      value={existingVisitorForm.remarks}
                      onChange={(e) => setExistingVisitorForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Entry'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Entry Log Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Entry Log Panel (Today)
              </span>
              <Badge variant="secondary">{filteredEntries.length} entries</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search by name, NIC, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">Loading entries...</div>
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No entries found for today</div>
                ) : (
                  <div className="space-y-2">
                    {filteredEntries.map((entry) => (
                      <div key={entry.id} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{entry.visitor_name}</div>
                            <div className="text-sm text-gray-600">
                              NIC: {entry.visitor_nic.replace(/(.{3})(.*)(.{3})/, '$1***$3')}
                            </div>
                            <div className="text-sm text-gray-600">
                              {entry.department_name} {entry.division_name && `- ${entry.division_name}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              Purpose: {entry.purpose_of_visit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {new Date(entry.entry_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                            <Badge variant={entry.visitor_type === 'new' ? 'default' : 'secondary'}>
                              {entry.visitor_type === 'new' ? 'New' : 'Existing'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicRegistry;
