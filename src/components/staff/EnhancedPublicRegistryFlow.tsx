
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
import { 
  Camera, 
  FileText, 
  Plus, 
  Search, 
  Download, 
  RefreshCw, 
  User, 
  UserPlus,
  Clock,
  Eye,
  CreditCard
} from 'lucide-react';
import { apiService } from '@/services/apiService';
import { tokenService } from '@/services/tokenService';
import QRCodeScanner from './QRCodeScanner';
import QRCodeIDCardGenerator from './QRCodeIDCardGenerator';
import VisitHistoryViewer from './VisitHistoryViewer';

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department_id: number;
}

interface RegistryEntry {
  id: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_address?: string;
  visitor_phone?: string;
  department_id: number;
  division_id?: number;
  purpose_of_visit: string;
  remarks?: string;
  entry_time: string;
  visitor_type: 'new' | 'existing';
  department_name?: string;
  division_name?: string;
  public_user_id?: number;
}

const EnhancedPublicRegistryFlow: React.FC = () => {
  const [activeTab, setActiveTab] = useState('new-visitor');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Modal states
  const [showScanner, setShowScanner] = useState(false);
  const [showIDCardGenerator, setShowIDCardGenerator] = useState(false);
  const [showHistoryViewer, setShowHistoryViewer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deptData, entriesData] = await Promise.all([
        apiService.getDepartments(),
        fetchTodayEntries()
      ]);
      setDepartments(deptData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayEntries = async () => {
    try {
      // For now, return empty array since we need to implement registry API
      return [];
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      return [];
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
    
    fetchDivisions(deptId);
  };

  const handleCreatePublicUser = async (userData: any) => {
    try {
      setSubmitting(true);
      
      const newUser = await apiService.createPublicUser({
        name: userData.visitor_name,
        nic: userData.visitor_nic,
        address: userData.visitor_address || '',
        mobile: userData.visitor_phone || '',
        email: '',
        department_id: parseInt(userData.department_id),
        division_id: userData.division_id ? parseInt(userData.division_id) : undefined,
        status: 'active'
      });

      setSelectedUser(newUser);
      setShowIDCardGenerator(true);
      
      toast({
        title: "Success",
        description: `Public user created with ID: ${newUser.public_id}`,
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
      
    } catch (error: any) {
      console.error('Error creating public user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create public user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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

    await handleCreatePublicUser(newVisitorForm);
  };

  const handleUserScanned = (user: any) => {
    setSelectedUser(user);
    setExistingVisitorForm({
      public_user_id: user.id,
      visitor_name: user.name,
      visitor_nic: user.nic,
      visitor_address: user.address,
      visitor_phone: user.mobile,
      department_id: user.department_id?.toString() || '',
      division_id: user.division_id?.toString() || '',
      purpose_of_visit: '',
      remarks: ''
    });
    setShowScanner(false);
    setActiveTab('existing-id');
    
    toast({
      title: "User Found",
      description: `${user.name} information loaded successfully`,
    });
  };

  const handleGenerateToken = async (registryId: number) => {
    try {
      const user = selectedUser;
      if (!user) return;

      const tokenData = {
        registry_id: registryId,
        department_id: existingVisitorForm.department_id,
        division_id: existingVisitorForm.division_id,
        public_user_id: user.id,
        service_type: existingVisitorForm.purpose_of_visit
      };

      const token = await tokenService.generateToken(tokenData);
      
      toast({
        title: "Token Generated",
        description: `Token ${token.token_number} generated successfully`,
      });
      
    } catch (error) {
      console.error('Error generating token:', error);
      toast({
        title: "Error",
        description: "Failed to generate token",
        variant: "destructive",
      });
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
      setSubmitting(true);
      
      // Create registry entry
      const registryEntry = {
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

      // For now, simulate registry creation and generate token directly
      await handleGenerateToken(1); // Placeholder registry ID
      
      toast({
        title: "Success",
        description: "Visitor registered and token generated",
      });
      
    } catch (error) {
      console.error('Error processing existing visitor:', error);
      toast({
        title: "Error",
        description: "Failed to process visitor",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Public Registry Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowHistoryViewer(true)} variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View History
          </Button>
          <Button onClick={fetchInitialData} variant="outline" size="sm">
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
                <TabsTrigger value="new-visitor">New Visitor</TabsTrigger>
                <TabsTrigger value="existing-id">Existing ID</TabsTrigger>
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
                        <SelectTrigger>
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
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                    <Plus className="w-4 h-4 mr-2" />
                    {submitting ? 'Creating Account...' : 'Create Account & Generate ID Card'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="existing-id" className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowScanner(true)}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </Button>
                </div>
                
                {selectedUser && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">Auto-filled fields:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Name: {selectedUser.name}</div>
                      <div>NIC: {selectedUser.nic?.replace(/(.{3})(.*)(.{3})/, '$1***$3')}</div>
                      <div>Address: {selectedUser.address}</div>
                      <div>Phone: {selectedUser.mobile}</div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleExistingVisitorSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="existing-visitor-department">Department *</Label>
                      <Select 
                        value={existingVisitorForm.department_id} 
                        onValueChange={(value) => handleDepartmentChange(value, false)}
                        required
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="existing-visitor-division">Division</Label>
                      <Select 
                        value={existingVisitorForm.division_id} 
                        onValueChange={(value) => setExistingVisitorForm(prev => ({ ...prev, division_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select division" />
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
                    <Label htmlFor="existing-visitor-remarks">Remarks</Label>
                    <Textarea
                      id="existing-visitor-remarks"
                      placeholder="Enter any additional remarks"
                      value={existingVisitorForm.remarks}
                      onChange={(e) => setExistingVisitorForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={submitting}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {submitting ? 'Generating Token...' : 'Generate Token'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Today's Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Today's Entries
              </span>
              <Badge variant="secondary">{registryEntries.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registryEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No entries found for today</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {registryEntries.map((entry) => (
                    <div key={entry.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{entry.visitor_name}</div>
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
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <QRCodeScanner
              onUserScanned={handleUserScanned}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {showIDCardGenerator && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <QRCodeIDCardGenerator
              user={selectedUser}
              onProceedToRegistry={() => {
                setShowIDCardGenerator(false);
                setActiveTab('existing-id');
              }}
            />
            <Button 
              onClick={() => setShowIDCardGenerator(false)} 
              variant="outline" 
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showHistoryViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <VisitHistoryViewer onClose={() => setShowHistoryViewer(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPublicRegistryFlow;
