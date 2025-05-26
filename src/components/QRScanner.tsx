
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Upload, Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ScannedUser {
  id: string;
  name: string;
  nic: string;
  address?: string;
  mobile?: string;
  services?: ServiceHistory[];
}

interface ServiceHistory {
  id: string;
  date: string;
  department: string;
  division: string;
  service: string;
  status: 'completed' | 'pending' | 'processing';
}

const QRScanner = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  // Sample departments and divisions
  const departments = [
    {
      id: 1,
      name: 'Health Services',
      divisions: ['Primary Health Care', 'Maternal Care', 'Vaccination']
    },
    {
      id: 2,
      name: 'Education',
      divisions: ['School Registration', 'Scholarships', 'Certificates']
    },
    {
      id: 3,
      name: 'Civil Registration',
      divisions: ['Birth Registration', 'Marriage Registration', 'Death Registration']
    }
  ];

  // Sample user data
  const sampleUsers: { [key: string]: ScannedUser } = {
    'PUB001': {
      id: 'PUB001',
      name: 'Ahmed Mohamed',
      nic: '199512345678',
      address: 'No. 123, Main Street, Kalmunai',
      mobile: '+94771234567',
      services: [
        {
          id: '1',
          date: '2024-01-15',
          department: 'Civil Registration',
          division: 'Birth Registration',
          service: 'Birth Certificate Application',
          status: 'completed'
        },
        {
          id: '2',
          date: '2024-02-20',
          department: 'Health Services',
          division: 'Vaccination',
          service: 'COVID-19 Vaccination',
          status: 'completed'
        }
      ]
    },
    'PUB002': {
      id: 'PUB002',
      name: 'Fatima Ibrahim',
      nic: '198798765432',
      address: 'No. 456, Temple Road, Kalmunai',
      mobile: '+94779876543',
      services: [
        {
          id: '3',
          date: '2024-01-10',
          department: 'Education',
          division: 'School Registration',
          service: 'School Admission',
          status: 'completed'
        }
      ]
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsScanning(false);
    }
  };

  const handleManualInput = () => {
    if (!manualInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Public ID",
        variant: "destructive",
      });
      return;
    }

    const user = sampleUsers[manualInput.trim()];
    if (user) {
      setScannedUser(user);
      setIsDialogOpen(true);
      setManualInput('');
      toast({
        title: "User Found",
        description: `Loaded details for ${user.name}`,
      });
    } else {
      toast({
        title: "Not Found",
        description: "Public ID not found in system",
        variant: "destructive",
      });
    }
  };

  const handleServiceUpdate = (departmentName: string, divisionName: string) => {
    const serviceKey = `${departmentName}-${divisionName}`;
    
    setSelectedServices(prev => 
      prev.includes(serviceKey) 
        ? prev.filter(s => s !== serviceKey)
        : [...prev, serviceKey]
    );
  };

  const saveServiceUpdates = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select at least one service to update",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Services Updated",
      description: `Updated ${selectedServices.length} services for ${scannedUser?.name}`,
    });
    
    setSelectedServices([]);
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800">QR Code Scanner</h3>
        <p className="text-gray-600 mt-2">Scan ID cards or enter Public ID manually</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="mr-2" size={20} />
              Camera Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-48 bg-gray-200 rounded-lg"
                autoPlay
                playsInline
                style={{ display: isScanning ? 'block' : 'none' }}
              />
              {!isScanning && (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Camera preview will appear here</span>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={startCamera}
                disabled={isScanning}
                className="flex-1"
              >
                Start Camera
              </Button>
              <Button 
                onClick={stopCamera}
                disabled={!isScanning}
                variant="outline"
                className="flex-1"
              >
                Stop Camera
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2" size={20} />
              Manual Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-id">Public ID</Label>
              <Input
                id="manual-id"
                placeholder="Enter Public ID (e.g., PUB001)"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
              />
            </div>
            <Button onClick={handleManualInput} className="w-full">
              <Search className="mr-2" size={16} />
              Search User
            </Button>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Test IDs:</strong></p>
              <p>• PUB001 - Ahmed Mohamed</p>
              <p>• PUB002 - Fatima Ibrahim</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Public User Details - {scannedUser?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Public ID:</strong> {scannedUser?.id}
                  </div>
                  <div>
                    <strong>Full Name:</strong> {scannedUser?.name}
                  </div>
                  <div>
                    <strong>NIC:</strong> {scannedUser?.nic}
                  </div>
                  <div>
                    <strong>Mobile:</strong> {scannedUser?.mobile}
                  </div>
                  <div className="col-span-2">
                    <strong>Address:</strong> {scannedUser?.address}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service History */}
            <Card>
              <CardHeader>
                <CardTitle>Service History</CardTitle>
              </CardHeader>
              <CardContent>
                {scannedUser?.services && scannedUser.services.length > 0 ? (
                  <div className="space-y-3">
                    {scannedUser.services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{service.service}</h4>
                            <p className="text-sm text-gray-600">
                              {service.department} - {service.division}
                            </p>
                            <p className="text-sm text-gray-500">{service.date}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                            {service.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No service history found</p>
                )}
              </CardContent>
            </Card>

            {/* Service Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Update Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((department) => (
                    <div key={department.id} className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-2">{department.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {department.divisions.map((division) => {
                          const serviceKey = `${department.name}-${division}`;
                          const isSelected = selectedServices.includes(serviceKey);
                          
                          return (
                            <div
                              key={division}
                              className={`p-2 border rounded cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-blue-100 border-blue-500' 
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                              onClick={() => handleServiceUpdate(department.name, division)}
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="mr-2"
                                />
                                <span className="text-sm">{division}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={saveServiceUpdates}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={selectedServices.length === 0}
                  >
                    Update Selected Services ({selectedServices.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRScanner;
