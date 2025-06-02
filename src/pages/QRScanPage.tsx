
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import type { PublicUser, Department, Division } from '@/services/api';
import { User, MapPin, Phone, Mail, Calendar, ArrowLeft } from 'lucide-react';

const QRScanPage = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serviceData, setServiceData] = useState({
    department_id: 0,
    division_id: 0,
    service_name: '',
    details: '',
    staff_user_id: localStorage.getItem('userId') || ''
  });
  useEffect(() => {
    if (publicId) {
      fetchUserData();
      fetchDepartments();
      fetchDivisions();
    }
  }, [publicId]);

  const fetchUserData = async () => {
    try {
      // First try to find user by public_id
      const users = await apiService.getPublicUsers();
      let foundUser = users.find(u => u.public_id === publicId);
      
      // If not found, try alternative formats
      if (!foundUser && publicId.match(/^PUB\d+$/)) {
        foundUser = users.find(u => u.public_id.replace(/[^0-9]/g, '') === publicId.replace(/[^0-9]/g, ''));
      }

      if (foundUser) {
        setUser(foundUser);
        toast({
          title: "User Found",
          description: `Verified: ${foundUser.name}`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with this QR code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiService.getDivisions();
      setDivisions(response);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      await apiService.addServiceHistory({
        public_user_id: user.public_id,
        department_id: serviceData.department_id,
        division_id: serviceData.division_id,
        service_name: serviceData.service_name,
        details: serviceData.details,
        staff_user_id: parseInt(serviceData.staff_user_id)
      });

      toast({
        title: "Service Updated",
        description: "Service history has been recorded successfully",
      });

      setServiceData({
        department_id: 0,
        division_id: 0,
        service_name: '',
        details: '',
        staff_user_id: localStorage.getItem('userId') || ''
      });
    } catch (error) {
      console.error('Error adding service history:', error);
      toast({
        title: "Error",
        description: "Failed to record service history",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredDivisions = () => {
    return divisions.filter(d => d.department_id === serviceData.department_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">User Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">The QR code does not match any registered user.</p>
            <Button onClick={() => navigate('/staff')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Service Update Portal</h1>
          <Button variant="outline" onClick={() => navigate('/staff')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-blue-800">{user.name}</h3>
                <p className="text-blue-600 font-medium">ID: {user.public_id}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">NIC:</span>
                  <span className="font-medium">{user.nic}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Mobile:</span>
                  <span className="font-medium">{user.mobile}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium">{user.email || 'Not provided'}</span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <span className="text-sm text-gray-600">Address:</span>
                  <span className="font-medium">{user.address}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Registered:</span>
                  <span className="font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Update Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Service Record</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select 
                    value={serviceData.department_id.toString()} 
                    onValueChange={(value) => setServiceData(prev => ({
                      ...prev, 
                      department_id: parseInt(value),
                      division_id: 0
                    }))}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Select Department</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="division">Division *</Label>
                  <Select 
                    value={serviceData.division_id.toString()} 
                    onValueChange={(value) => setServiceData(prev => ({
                      ...prev, 
                      division_id: parseInt(value)
                    }))}
                    disabled={!serviceData.department_id}
                  >
                    <SelectTrigger id="division">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Select Division</SelectItem>
                      {getFilteredDivisions().map((div) => (
                        <SelectItem key={div.id} value={div.id.toString()}>
                          {div.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_name">Service Name *</Label>
                  <Input
                    id="service_name"
                    value={serviceData.service_name}
                    onChange={(e) => setServiceData(prev => ({
                      ...prev, 
                      service_name: e.target.value
                    }))}
                    placeholder="Enter service name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Service Details</Label>
                  <Textarea
                    id="details"
                    value={serviceData.details}
                    onChange={(e) => setServiceData(prev => ({
                      ...prev, 
                      details: e.target.value
                    }))}
                    placeholder="Enter service details..."
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting || !serviceData.department_id || !serviceData.service_name}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {submitting ? 'Recording...' : 'Record Service'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRScanPage;
