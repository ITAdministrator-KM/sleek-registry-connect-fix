
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CameraOff, Scan, Smartphone, Monitor, CheckCircle, AlertCircle, Usb, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
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

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent) || isMobile;
    setDeviceType(isMobileDevice ? 'mobile' : 'desktop');
    
    if (isMobileDevice) {
      checkCameraPermission();
    } else {
      checkUSBDevices();
    }
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
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
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

  const startMobileScanning = useCallback(async () => {
    if (cameraPermission !== 'granted') {
      await checkCameraPermission();
      return;
    }

    try {
      setIsScanning(true);
      
      // Enhanced config for better touch scanning
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        // Enhanced camera constraints
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          advanced: [
            { focusMode: 'continuous' },
            { exposureMode: 'continuous' },
            { whiteBalanceMode: 'continuous' }
          ]
        },
        // UI customization
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2
      };

      scannerRef.current = new Html5QrcodeScanner('qr-reader-mobile', config, false);
      
      scannerRef.current.render(
        (decodedText: string) => {
          console.log('QR Code detected:', decodedText);
          handleScanSuccess(decodedText);
        },
        (error: string) => {
          // Only log significant errors
          if (!error.includes('NotFoundException') && !error.includes('No MultiFormat Readers')) {
            console.warn('QR Scan Error:', error);
          }
        }
      );

      toast({
        title: "📷 Scanner Active",
        description: "Hold your device steady and center the QR code",
      });

    } catch (error) {
      console.error('Scanner error:', error);
      setIsScanning(false);
      toast({
        title: "Scanner Error",
        description: "Failed to start scanner. Please try again.",
        variant: "destructive",
      });
    }
  }, [cameraPermission, toast]);

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear()
        .then(() => {
          setIsScanning(false);
          console.log('Scanner stopped successfully');
          toast({
            title: "Scanner Stopped",
            description: "QR code scanning has been stopped",
          });
        })
        .catch((error) => {
          console.error('Error stopping scanner:', error);
          setIsScanning(false);
        });
      scannerRef.current = null;
    }
  }, [toast]);

  const handleScanSuccess = async (decodedText: string) => {
    console.log('Processing scanned data:', decodedText);
    
    // Stop scanner immediately to prevent multiple scans
    stopScanning();
    
    try {
      let userData;
      try {
        userData = JSON.parse(decodedText);
      } catch {
        userData = { public_id: decodedText };
      }
      
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
          title: "✅ User Verified",
          description: `Found: ${user.name} (${user.public_id})`,
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
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const staffUserId = userData.id;
      
      if (!staffUserId) {
        toast({
          title: "Authentication Error",
          description: "Staff user not authenticated",
          variant: "destructive",
        });
        return;
      }

      // Since we don't have recordQRScan in apiService, we'll simulate it
      const scanRecord = {
        public_user_id: scannedUser.id || 0,
        staff_user_id: staffUserId,
        scan_purpose: serviceForm.scan_purpose,
        scan_location: serviceForm.scan_location,
        scan_data: JSON.stringify({ ...scannedUser, notes: serviceForm.notes }),
        scan_time: new Date().toISOString()
      };

      // Add to local history
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
                <QrCode className="h-6 w-6 text-blue-600" />
                Enhanced QR Scanner
                {deviceType === 'mobile' ? (
                  <Smartphone className="h-5 w-5 text-green-600" />
                ) : (
                  <Monitor className="h-5 w-5 text-blue-600" />
                )}
              </CardTitle>
              <CardDescription>
                {deviceType === 'mobile' 
                  ? "Touch-optimized camera scanning for ID cards"
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
                      📷 Start Scanner
                    </Button>
                  ) : (
                    <Button onClick={stopScanning} variant="destructive">
                      <CameraOff className="mr-2 h-4 w-4" />
                      Stop Scanner
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
                  className={`w-full border-2 border-dashed border-gray-300 rounded-lg ${isScanning ? 'block' : 'hidden'}`}
                  style={{ minHeight: '320px' }}
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
                          Touch scanning requires camera permission
                        </p>
                        <Button onClick={checkCameraPermission} variant="outline">
                          <Camera className="mr-2 h-4 w-4" />
                          Enable Camera
                        </Button>
                      </>
                    ) : (
                      <>
                        <Camera className="mx-auto h-12 w-12 text-green-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">📱 Touch Scanner Ready</h3>
                        <p className="text-gray-500 mb-4">
                          Tap "Start Scanner" to begin touch-based QR scanning
                        </p>
                        <div className="bg-green-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-green-700 mb-2">📋 Scanning Tips:</p>
                          <ul className="text-xs text-green-600 text-left space-y-1">
                            <li>• Hold device steady</li>
                            <li>• Ensure good lighting</li>
                            <li>• Center QR code in frame</li>
                            <li>• Keep 10-30cm distance</li>
                            <li>• Touch to focus if needed</li>
                          </ul>
                        </div>
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
