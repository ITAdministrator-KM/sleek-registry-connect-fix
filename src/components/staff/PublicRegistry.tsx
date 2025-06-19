import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  QrCode, 
  Camera, 
  UserPlus, 
  Search, 
  Download,
  Clock,
  RefreshCw
} from 'lucide-react';
import { apiService, Department, Division, PublicUser } from '@/services/api';
import { registryApiService, RegistryEntry, RegistryEntryCreateData } from '@/services/registryApi';
import { useAuth } from '@/hooks/useAuth';
import ResponsiveQRScanner from '@/components/ResponsiveQRScanner';

const PublicRegistry = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [visitorType, setVisitorType] = useState<'new' | 'existing'>('new');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedUser, setScannedUser] = useState<PublicUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Registry data
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [filteredDivisions, setFilteredDivisions] = useState<Division[]>([]);
  
  // Filters
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    address: '',
    phone: '',
    department_id: '',
    division_id: '',
    purpose_of_visit: '',
    remarks: '',
    public_id: ''
  });

  // Form validation
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchInitialData();
    fetchTodayEntries();
    
    // Auto-refresh entries every 30 seconds
    const interval = setInterval(fetchTodayEntries, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      const deptDivisions = divisions.filter(d => d.department_id === parseInt(formData.department_id));
      setFilteredDivisions(deptDivisions);
    } else {
      setFilteredDivisions([]);
    }
  }, [formData.department_id, divisions]);

  useEffect(() => {
    fetchTodayEntries();
  }, [filterDate]);

  const validateForm = (type: 'new' | 'existing') => {
    const errors: {[key: string]: string} = {};
    
    if (type === 'new') {
      if (!formData.name.trim()) errors.name = 'Name is required';
      if (!formData.nic.trim()) errors.nic = 'NIC is required';
      if (!formData.address.trim()) errors.address = 'Address is required';
      if (!formData.department_id) errors.department_id = 'Department is required';
    } else {
      if (!formData.purpose_of_visit.trim()) errors.purpose_of_visit = 'Purpose of visit is required';
      if (!formData.department_id) errors.department_id = 'Department is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [depts, divs] = await Promise.all([
        apiService.getDepartments(),
        apiService.getDivisions()
      ]);
      setDepartments(depts);
      setDivisions(divs);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load departments and divisions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayEntries = async () => {
    try {
      const entries = await registryApiService.getRegistryEntries({
        date: filterDate,
        status: 'active'
      });
      setRegistryEntries(entries);
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      toast({
        title: "Error",
        description: "Failed to load registry entries",
        variant: "destructive",
      });
    }
  };

  const handlePublicIdLookup = async () => {
    if (!formData.public_id.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Public ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const users = await apiService.getPublicUsers();
      const foundUser = users.find(u => u.public_id === formData.public_id);
      
      if (foundUser) {
        setScannedUser(foundUser);
        setFormData(prev => ({
          ...prev,
          name: foundUser.name,
          nic: foundUser.nic,
          address: foundUser.address || '',
          phone: foundUser.mobile || '',
          department_id: foundUser.department_id?.toString() || '',
          division_id: foundUser.division_id?.toString() || ''
        }));
        
        toast({
          title: "User Found",
          description: `Welcome back, ${foundUser.name}!`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with this ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error looking up user:', error);
      toast({
        title: "Error",
        description: "Failed to lookup user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = (result: string) => {
    try {
      const qrData = JSON.parse(result);
      if (qrData.public_id) {
        setFormData(prev => ({ ...prev, public_id: qrData.public_id }));
        handlePublicIdLookup();
        setShowQRScanner(false);
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Please scan a valid Public ID QR code",
        variant: "destructive",
      });
    }
  };

  const handleCreateAccount = async () => {
    if (!validateForm('new')) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const userData = {
        name: formData.name,
        nic: formData.nic,
        address: formData.address,
        mobile: formData.phone || '',
        email: `${formData.nic}@dskalmunai.lk`,
        username: formData.nic,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        division_id: formData.division_id ? parseInt(formData.division_id) : undefined
      };

      const newUser = await apiService.createPublicUser(userData);
      
      toast({
        title: "Account Created",
        description: `Public ID: ${newUser.public_id}`,
      });

      setScannedUser(newUser);
      setVisitorType('existing');
      
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrySubmit = async () => {
    if (!validateForm('existing')) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const registryData: RegistryEntryCreateData = {
        public_user_id: scannedUser?.id,
        visitor_name: formData.name,
        visitor_nic: formData.nic,
        visitor_address: formData.address,
        visitor_phone: formData.phone,
        department_id: parseInt(formData.department_id),
        division_id: formData.division_id ? parseInt(formData.division_id) : undefined,
        purpose_of_visit: formData.purpose_of_visit,
        remarks: formData.remarks,
        visitor_type: visitorType
      };

      const newEntry = await registryApiService.createRegistryEntry(registryData);
      
      // Refresh the entries list
      await fetchTodayEntries();
      
      toast({
        title: "Entry Recorded",
        description: `Registry ID: ${newEntry.registry_id || 'Generated'}`,
      });

      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error recording entry:', error);
      toast({
        title: "Error",
        description: "Failed to record entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', nic: '', address: '', phone: '', 
      department_id: '', division_id: '', purpose_of_visit: '', remarks: '', public_id: ''
    });
    setScannedUser(null);
    setVisitorType('new');
    setFormErrors({});
  };

  const exportToCSV = async () => {
    try {
      const blob = await registryApiService.exportRegistryData({
        date: filterDate,
        department_id: filterDepartment !== 'all' ? parseInt(filterDepartment) : undefined,
        format: 'csv'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registry_${filterDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to export CSV",
        variant: "destructive",
      });
    }
  };

  const filteredEntries = registryEntries.filter(entry => {
    const matchesSearch = entry.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.visitor_nic.includes(searchTerm);
    const matchesDepartment = filterDepartment === 'all' || 
                             entry.department_id === parseInt(filterDepartment);
    
    return matchesSearch && matchesDepartment;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Public Visitor Registry
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Registry Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-semibold">Register New Entry</h3>
            <Button 
              variant="outline" 
              onClick={fetchTodayEntries}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visitor Type Selection */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label className="text-base font-medium mb-4 block">Select Visitor Type:</Label>
            <RadioGroup 
              value={visitorType} 
              onValueChange={(value: 'new' | 'existing') => {
                setVisitorType(value);
                resetForm();
              }}
              className="flex flex-row gap-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new-visitor" />
                <Label htmlFor="new-visitor" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  New Visitor
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing-visitor" />
                <Label htmlFor="existing-visitor" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Existing ID
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* New Visitor Form */}
          {visitorType === 'new' && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create New Public Account
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    className={`mt-1 ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="nic">NIC Number *</Label>
                  <Input
                    id="nic"
                    value={formData.nic}
                    onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
                    placeholder="Enter NIC number"
                    className={`mt-1 ${formErrors.nic ? 'border-red-500' : ''}`}
                  />
                  {formErrors.nic && <p className="text-red-500 text-sm mt-1">{formErrors.nic}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter full address"
                    className={`mt-1 ${formErrors.address ? 'border-red-500' : ''}`}
                  />
                  {formErrors.address && <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>}
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select 
                    value={formData.department_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value, division_id: '' }))}
                  >
                    <SelectTrigger className={`mt-1 ${formErrors.department_id ? 'border-red-500' : ''}`}>
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
                  {formErrors.department_id && <p className="text-red-500 text-sm mt-1">{formErrors.department_id}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="mt-1"
                    type="tel"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Any additional notes"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button 
                    onClick={handleCreateAccount}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Creating...' : 'Save Account & Proceed to Registry Entry'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Visitor Form */}
          {visitorType === 'existing' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Scan or Enter Public ID
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    variant="outline"
                    className="flex items-center gap-2 flex-1"
                  >
                    <Camera className="h-4 w-4" />
                    Scan QR Code
                  </Button>
                  <div className="flex gap-2 flex-2">
                    <Input
                      value={formData.public_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, public_id: e.target.value }))}
                      placeholder="Enter Public ID (e.g., PUB00001)"
                      className="flex-1"
                    />
                    <Button onClick={handlePublicIdLookup} variant="outline">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {scannedUser && (
                  <div className="p-4 bg-white rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">Auto-filled Information:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {scannedUser.name}
                      </div>
                      <div>
                        <span className="font-medium">NIC:</span> {scannedUser.nic.replace(/\d(?=\d{3})/g, '*')}
                      </div>
                      <div>
                        <span className="font-medium">Department:</span> {scannedUser.department_name || 'Not assigned'}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium">Address:</span> {scannedUser.address}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="purpose">Purpose of Visit *</Label>
                    <Input
                      id="purpose"
                      value={formData.purpose_of_visit}
                      onChange={(e) => setFormData(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
                      placeholder="Enter purpose of visit"
                      className={`mt-1 ${formErrors.purpose_of_visit ? 'border-red-500' : ''}`}
                    />
                    {formErrors.purpose_of_visit && <p className="text-red-500 text-sm mt-1">{formErrors.purpose_of_visit}</p>}
                  </div>
                  <div>
                    <Label htmlFor="visit-department">Department *</Label>
                    <Select 
                      value={formData.department_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value, division_id: '' }))}
                    >
                      <SelectTrigger className={`mt-1 ${formErrors.department_id ? 'border-red-500' : ''}`}>
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
                    {formErrors.department_id && <p className="text-red-500 text-sm mt-1">{formErrors.department_id}</p>}
                  </div>
                  <div>
                    <Label htmlFor="visit-remarks">Remarks (optional)</Label>
                    <Textarea
                      id="visit-remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Any additional notes"
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button 
                      onClick={handleRegistrySubmit}
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Entry Log Panel */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Entry Log - {new Date(filterDate).toLocaleDateString()}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or NIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-40"
              />
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entries Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Registry ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">NIC</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Purpose</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(entry.entry_time).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {entry.registry_id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.visitor_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {entry.visitor_nic.replace(/\d(?=\d{3})/g, '*')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {entry.department_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {entry.purpose_of_visit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <Badge variant={entry.visitor_type === 'new' ? 'default' : 'secondary'}>
                        {entry.visitor_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <Badge variant={
                        entry.status === 'active' ? 'default' :
                          entry.status === 'checked_out' ? 'secondary' : 'destructive'
                      }>
                        {entry.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No entries found for the selected date and filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <ResponsiveQRScanner
              onScanSuccess={handleQRScan}
              onError={(error) => {
                console.error('QR Scan error:', error);
                toast({
                  title: "Scan Error",
                  description: "Failed to scan QR code",
                  variant: "destructive",
                });
              }}
              onClose={() => setShowQRScanner(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicRegistry;
