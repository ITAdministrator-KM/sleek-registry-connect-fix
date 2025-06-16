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
  Filter,
  Download,
  Clock,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { apiService, Department, Division } from '@/services/apiService';
import { useAuth } from '@/hooks/useAuth';
import ResponsiveQRScanner from '@/components/ResponsiveQRScanner';

interface RegistryEntry {
  id: number;
  registry_id: string;
  public_user_id?: number;
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
  status: 'active' | 'checked_out';
  department_name?: string;
  division_name?: string;
}

interface PublicUser {
  id: number;
  public_user_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
}

const PublicRegistry = () => {
  const { user } = useAuth('staff');
  const { toast } = useToast();
  
  // Form state
  const [visitorType, setVisitorType] = useState<'new' | 'existing'>('new');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedUser, setScannedUser] = useState<PublicUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const fetchInitialData = async () => {
    try {
      const [depts, divs] = await Promise.all([
        apiService.getDepartments(),
        apiService.getDivisions()
      ]);
      setDepartments(depts);
      setDivisions(divs);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchTodayEntries = async () => {
    try {
      // This would be a new API endpoint for registry entries
      // For now, we'll use mock data
      const mockEntries: RegistryEntry[] = [
        {
          id: 1,
          registry_id: 'REG001',
          visitor_name: 'Jane Perera',
          visitor_nic: '********9V',
          purpose_of_visit: 'License Renewal',
          entry_time: new Date().toISOString(),
          visitor_type: 'existing',
          status: 'active',
          department_id: 1,
          department_name: 'Licensing'
        }
      ];
      setRegistryEntries(mockEntries);
    } catch (error) {
      console.error('Error fetching registry entries:', error);
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
      // This would call the API to get user by public_id
      const users = await apiService.getPublicUsers();
      const user = users.find(u => u.public_user_id === formData.public_id);
      
      if (user) {
        const mappedUser: PublicUser = {
          id: user.id,
          public_user_id: user.public_user_id,
          name: user.name,
          nic: user.nic,
          address: user.address,
          mobile: user.mobile,
          email: user.email,
          department_id: user.department_id,
          division_id: user.division_id,
          department_name: user.department_name,
          division_name: user.division_name
        };
        
        setScannedUser(mappedUser);
        setFormData(prev => ({
          ...prev,
          name: user.name,
          nic: user.nic,
          address: user.address,
          phone: user.mobile,
          department_id: user.department_id?.toString() || '',
          division_id: user.division_id?.toString() || ''
        }));
        
        toast({
          title: "User Found",
          description: `Welcome back, ${user.name}!`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with this ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lookup user",
        variant: "destructive",
      });
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
    if (!formData.name || !formData.nic || !formData.address) {
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
        email: `${formData.nic}@temp.dsk.lk`, // Temporary email
        username: formData.nic,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        division_id: formData.division_id ? parseInt(formData.division_id) : null
      };

      const newUser = await apiService.createPublicUser(userData);
      
      toast({
        title: "Account Created",
        description: `Public ID: ${newUser.public_id}`,
      });

      // Auto-proceed to registry entry
      setScannedUser({
        ...userData,
        id: newUser.id,
        public_user_id: newUser.public_id,
        email: userData.email
      } as PublicUser);
      
      setVisitorType('existing');
    } catch (error) {
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
    if (!formData.purpose_of_visit.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the purpose of visit",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // This would call a new API endpoint to create registry entry
      const registryData = {
        public_user_id: scannedUser?.id,
        visitor_name: formData.name,
        visitor_nic: formData.nic,
        visitor_address: formData.address,
        visitor_phone: formData.phone,
        department_id: parseInt(formData.department_id),
        division_id: formData.division_id ? parseInt(formData.division_id) : null,
        purpose_of_visit: formData.purpose_of_visit,
        remarks: formData.remarks,
        visitor_type: visitorType,
        staff_user_id: user?.id
      };

      // Mock successful submission
      const newEntry: RegistryEntry = {
        id: Date.now(),
        registry_id: `REG${String(Date.now()).slice(-6)}`,
        ...registryData,
        entry_time: new Date().toISOString(),
        status: 'active',
        department_name: departments.find(d => d.id === registryData.department_id)?.name
      };

      setRegistryEntries(prev => [newEntry, ...prev]);
      
      toast({
        title: "Entry Recorded",
        description: `Registry ID: ${newEntry.registry_id}`,
      });

      // Reset form
      setFormData({
        name: '', nic: '', address: '', phone: '', 
        department_id: '', division_id: '', purpose_of_visit: '', remarks: '', public_id: ''
      });
      setScannedUser(null);
      setVisitorType('new');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToPDF = () => {
    toast({
      title: "Export Started",
      description: "PDF export will be available soon",
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Time', 'Name', 'NIC', 'Department', 'Purpose', 'Type'],
      ...registryEntries.map(entry => [
        new Date(entry.entry_time).toLocaleTimeString(),
        entry.visitor_name,
        entry.visitor_nic,
        entry.department_name || '',
        entry.purpose_of_visit,
        entry.visitor_type
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registry_${filterDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEntries = registryEntries.filter(entry => {
    const matchesSearch = entry.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.visitor_nic.includes(searchTerm);
    const matchesDepartment = filterDepartment === 'all' || 
                             entry.department_id === parseInt(filterDepartment);
    const matchesDate = new Date(entry.entry_time).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesDepartment && matchesDate;
  });

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
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
            >
              <RefreshCw className="h-4 w-4" />
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
                setScannedUser(null);
                setFormData({
                  name: '', nic: '', address: '', phone: '', 
                  department_id: '', division_id: '', purpose_of_visit: '', remarks: '', public_id: ''
                });
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
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nic">NIC Number *</Label>
                  <Input
                    id="nic"
                    value={formData.nic}
                    onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
                    placeholder="Enter NIC number"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter full address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={formData.department_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value, division_id: '' }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="mt-1"
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

                {(scannedUser || visitorType === 'existing') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="purpose">Purpose of Visit *</Label>
                      <Input
                        id="purpose"
                        value={formData.purpose_of_visit}
                        onChange={(e) => setFormData(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
                        placeholder="Enter purpose of visit"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
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
                        disabled={isSubmitting || !formData.purpose_of_visit.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                      </Button>
                    </div>
                  </div>
                )}
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
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                CSV
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
                className="w-full"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full md:w-48"
            />
          </div>

          {/* Entries Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Time</th>
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {entry.visitor_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {entry.visitor_nic.replace(/\d(?=\d{3})/g, '*')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {entry.department_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {entry.purpose_of_visit}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.visitor_type === 'new' ? 'default' : 'secondary'}>
                          {entry.visitor_type === 'new' ? 'New' : 'Existing'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.status === 'active' ? 'default' : 'outline'}>
                          {entry.status === 'active' ? 'Active' : 'Checked Out'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No entries found for the selected criteria
              </div>
            )}
          </div>
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
