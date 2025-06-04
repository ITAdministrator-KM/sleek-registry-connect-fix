
import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CameraOff, Scan, Smartphone, Monitor, CheckCircle, AlertCircle, Usb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScannedUser {
  id?: number;
  public_id: string;
  name: string;
  nic: string;
  mobile: string;
  address: string;
  email?: string;
}

const ResponsiveQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [usbConnected, setUsbConnected] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [serviceForm, setServiceForm] = useState({
    scan_purpose: '',
    scan_location: '',
    notes: ''
  });
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent) || isMobile;
    setDeviceType(isMobileDevice ? 'mobile' : 'desktop');
    
    if (isMobileDevice) {
      checkCameraPermission();
    } else {
      checkUSBDevices();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isMobile]);

  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission('denied');
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access",
          variant: "destructive",
        });
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length === 0) {
        setCameraPermission('denied');
        toast({
          title: "No Camera Found",
          description: "No camera devices detected on this device",
          variant: "destructive",
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        setCameraPermission('granted');
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Camera Ready",
          description: "Camera access granted for QR scanning",
        });
      } catch (error: any) {
        setCameraPermission('denied');
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Camera Permission Denied",
            description: "Please allow camera access in your browser settings",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      setCameraPermission('denied');
    }
  };

  const checkUSBDevices = async () => {
    try {
      if ('serial' in navigator) {
        const ports = await (navigator as any).serial.getPorts();
        setUsbConnected(ports.length > 0);
      }
    } catch (error) {
      console.log('USB Serial API not supported or no devices found');
    }
  };

  const startMobileScanning = async () => {
    if (cameraPermission !== 'granted') {
      await checkCameraPermission();
      return;
    }

    try {
      setIsScanning(true);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      };

      scannerRef.current = new Html5QrcodeScanner('qr-reader-mobile', config, false);
      
      scannerRef.current.render(
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        (error: string) => {
          // Ignore common scanning errors
          if (!error.includes('NotFoundException')) {
            console.warn('QR Scan Error:', error);
          }
        }
      );

      toast({
        title: "📷 Mobile Scanner Started",
        description: "Point your camera at the QR code on the ID card",
      });

    } catch (error) {
      setIsScanning(false);
      toast({
        title: "Scanner Error",
        description: "Failed to start mobile scanner",
        variant: "destructive",
      });
    }
  };

  const requestUSBAccess = async () => {
    try {
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        setUsbConnected(true);
        
        toast({
          title: "🔌 USB Scanner Connected",
          description: "USB QR scanner is ready for use",
        });
      } else {
        toast({
          title: "USB Not Supported",
          description: "Your browser doesn't support USB serial devices",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "USB Connection Failed",
        description: "Failed to connect USB scanner",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
        .then(() => {
          setIsScanning(false);
          toast({
            title: "Scanner Stopped",
            description: "QR code scanning has been stopped",
          });
        })
        .catch((error) => {
          console.error('Error stopping scanner:', error);
          setIsScanning(false);
        });
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    console.log('QR Code scanned:', decodedText);
    stopScanning();
    
    try {
      // Try to parse as JSON first
      let userData;
      try {
        userData = JSON.parse(decodedText);
      } catch {
        // If not JSON, treat as public ID
        userData = { public_id: decodedText };
      }
      
      // Fetch user data from database
      await fetchUserByPublicId(userData.public_id || decodedText);
      
    } catch (error) {
      console.error('Error processing scan:', error);
      toast({
        title: "Scan Error",
        description: "Failed to process QR code data",
        variant: "destructive",
      });
    }
  };

  const handleManualInput = async () => {
    if (!manualInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a Public ID to search",
        variant: "destructive",
      });
      return;
    }
    
    await fetchUserByPublicId(manualInput.trim());
  };

  const fetchUserByPublicId = async (publicId: string) => {
    try {
      const users = await apiService.getPublicUsers();
      const user = users.find(u => u.public_id === publicId);
      
      if (user) {
        setScannedUser({
          id: user.id,
          public_id: user.public_id,
          name: user.name,
          nic: user.nic,
          mobile: user.mobile,
          address: user.address,
          email: user.email
        });
        
        toast({
          title: "✅ User Found",
          description: `Verified: ${user.name} (${user.public_id})`,
        });
      } else {
        toast({
          title: "❌ User Not Found",
          description: `No user found with ID: ${publicId}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Database Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    }
  };

  const recordScan = async () => {
    if (!scannedUser) {
      toast({
        title: "No User Data",
        description: "Please scan a QR code first",
        variant: "destructive",
      });
      return;
    }

    try {
      const staffUserId = localStorage.getItem('userId');
      
      if (!staffUserId) {
        toast({
          title: "Authentication Error",
          description: "Staff user not authenticated",
          variant: "destructive",
        });
        return;
      }

      await apiService.recordQRScan({
        public_user_id: scannedUser.id || 0,
        staff_user_id: parseInt(staffUserId),
        scan_purpose: serviceForm.scan_purpose,
        scan_location: serviceForm.scan_location,
        scan_data: JSON.stringify({ ...scannedUser, notes: serviceForm.notes })
      });

      setScanHistory(prev => [{
        ...scannedUser,
        scan_time: new Date().toISOString(),
        purpose: serviceForm.scan_purpose,
        location: serviceForm.scan_location
      }, ...prev]);

      toast({
        title: "✅ Service Recorded",
        description: "QR scan and service visit recorded successfully",
      });

      // Reset form
      setServiceForm({ scan_purpose: '', scan_location: '', notes: '' });
      setScannedUser(null);
      setManualInput('');

    } catch (error) {
      console.error('Error recording scan:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to record service visit",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-6 w-6 text-blue-600" />
                Responsive QR Scanner
                {deviceType === 'mobile' ? (
                  <Smartphone className="h-5 w-5 text-green-600" />
                ) : (
                  <Monitor className="h-5 w-5 text-blue-600" />
                )}
              </CardTitle>
              <CardDescription>
                {deviceType === 'mobile' 
                  ? "Mobile camera scanning optimized for ID cards"
                  : "Desktop mode with USB scanner support"
                }
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {deviceType === 'mobile' ? (
                <>
                  {cameraPermission === 'granted' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {cameraPermission === 'denied' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  
                  {!isScanning ? (
                    <Button 
                      onClick={startMobileScanning}
                      disabled={cameraPermission !== 'granted'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      📷 Start Camera
                    </Button>
                  ) : (
                    <Button onClick={stopScanning} variant="destructive">
                      <CameraOff className="mr-2 h-4 w-4" />
                      Stop Camera
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {usbConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Button onClick={requestUSBAccess} variant="outline">
                      <Usb className="mr-2 h-4 w-4" />
                      🔌 Connect USB Scanner
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanning Section */}
            <div className="space-y-4">
              {deviceType === 'mobile' && (
                <div 
                  id="qr-reader-mobile" 
                  className={`w-full ${isScanning ? 'block' : 'hidden'}`}
                  style={{ minHeight: '300px' }}
                />
              )}
              
              {!isScanning && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {deviceType === 'mobile' ? (
                    cameraPermission === 'denied' ? (
                      <>
                        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">📷 Camera Access Required</h3>
                        <p className="text-gray-500 mb-4">
                          Please allow camera access to scan QR codes from ID cards
                        </p>
                        <Button onClick={checkCameraPermission} variant="outline">
                          <Camera className="mr-2 h-4 w-4" />
                          Enable Camera
                        </Button>
                      </>
                    ) : (
                      <>
                        <Camera className="mx-auto h-12 w-12 text-green-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">📱 Mobile Scanner Ready</h3>
                        <p className="text-gray-500 mb-4">
                          Tap "Start Camera" to begin scanning ID card QR codes
                        </p>
                      </>
                    )
                  ) : (
                    <>
                      <Monitor className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">🖥️ Desktop Scanner Mode</h3>
                      <p className="text-gray-500 mb-4">
                        {usbConnected 
                          ? "USB scanner connected. Scan ID cards or use manual input below."
                          : "Connect a USB QR scanner or use manual input below."
                        }
                      </p>
                      {!usbConnected && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-blue-700 mb-2">💡 USB Scanner Instructions:</p>
                          <ul className="text-xs text-blue-600 text-left space-y-1">
                            <li>• Connect your USB QR scanner</li>
                            <li>• Click "Connect USB Scanner" button</li>
                            <li>• Select your device when prompted</li>
                            <li>• Scan ID cards directly</li>
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Manual Input */}
              <div className="space-y-3">
                <Label htmlFor="manual-input">Manual Public ID Entry</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-input"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter Public ID (e.g., PUB00001)"
                    className="flex-1"
                  />
                  <Button onClick={handleManualInput} variant="outline">
                    <Scan className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Results and Service Form */}
            <div className="space-y-4">
              {scannedUser && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      ✅ User Verified
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Public ID:</strong> {scannedUser.public_id}</div>
                    <div><strong>Name:</strong> {scannedUser.name}</div>
                    <div><strong>NIC:</strong> {scannedUser.nic}</div>
                    <div><strong>Mobile:</strong> {scannedUser.mobile}</div>
                    <div><strong>Address:</strong> {scannedUser.address}</div>
                    {scannedUser.email && (
                      <div><strong>Email:</strong> {scannedUser.email}</div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏢 Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="scan_purpose">Purpose of Visit</Label>
                    <Input
                      id="scan_purpose"
                      value={serviceForm.scan_purpose}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, scan_purpose: e.target.value }))}
                      placeholder="e.g., Birth Certificate, NIC Application"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="scan_location">Service Location</Label>
                    <Input
                      id="scan_location"
                      value={serviceForm.scan_location}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, scan_location: e.target.value }))}
                      placeholder="e.g., Front Desk, Department Office"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={serviceForm.notes}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes or comments"
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    onClick={recordScan}
                    disabled={!scannedUser}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    📝 Record Service Visit
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{scan.name || 'Unknown'} ({scan.public_id})</p>
                      <p className="text-sm text-gray-600">{scan.purpose}</p>
                      <p className="text-xs text-gray-500">{scan.location}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(scan.scan_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResponsiveQRScanner;
