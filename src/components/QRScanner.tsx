
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Monitor, Smartphone, AlertCircle } from 'lucide-react';

interface ScanResult {
  public_id: string;
  name: string;
  nic: string;
  timestamp: number;
}

interface PublicUserDetails {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email?: string;
  department_name?: string;
  division_name?: string;
}

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [userDetails, setUserDetails] = useState<PublicUserDetails | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    detectDeviceType();
    checkCameraPermission();
    fetchAvailableCameras();
    return () => {
      cleanupScanner();
    };
  }, []);

  const detectDeviceType = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
  };

  const fetchAvailableCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setAvailableCameras(devices);
      if (devices.length > 0) {
        // For mobile, prefer back camera; for desktop, use first available
        const preferredCamera = deviceType === 'mobile' 
          ? devices.find(device => device.label.toLowerCase().includes('back')) || devices[0]
          : devices[0];
        setSelectedCamera(preferredCamera.id);
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
    }
  };

  const checkCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setHasPermission(permission.state === 'granted');
      
      permission.addEventListener('change', () => {
        setHasPermission(permission.state === 'granted');
      });
    } catch (error) {
      console.error('Error checking camera permission:', error);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      } catch (err) {
        console.error('Error requesting camera access:', err);
        setHasPermission(false);
      }
    }
  };

  const cleanupScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  const fetchUserDetails = async (publicId: string) => {
    try {
      const users = await apiService.getPublicUsers();
      const user = users.find(u => u.public_id === publicId);
      if (user) {
        setUserDetails(user);
      } else {
        toast({
          title: "User Not Found",
          description: `No user found with ID: ${publicId}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      });
    }
  };

  const initializeScanner = async () => {
    try {
      if (!hasPermission) {
        await checkCameraPermission();
        if (!hasPermission) {
          throw new Error("Camera permission denied");
        }
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("No camera devices found");
      }

      const cameraId = selectedCamera || devices[0].id;

      const qrCodeSuccessCallback = async (decodedText: string) => {
        try {
          let result: ScanResult;
          
          // Try to parse as JSON first
          try {
            result = JSON.parse(decodedText) as ScanResult;
          } catch {
            // If not JSON, assume it's a public_id string
            result = {
              public_id: decodedText,
              name: '',
              nic: '',
              timestamp: Date.now()
            };
          }
          
          setLastScan(result);
          
          // Fetch full user details
          await fetchUserDetails(result.public_id);
          
          // Record the scan
          await apiService.recordQRScan({
            public_user_id: parseInt(result.public_id.replace('PUB', ''), 10),
            staff_user_id: parseInt(localStorage.getItem('userId') || '1', 10),
            scan_purpose: 'verification',
            scan_location: deviceType === 'mobile' ? 'mobile_device' : 'office_desktop'
          });

          toast({
            title: "Scan Successful",
            description: `Scanned ID: ${result.public_id}`,
          });
        } catch (error) {
          console.error('Error processing QR code:', error);
          toast({
            title: "Error",
            description: "Invalid QR code format or failed to process",
            variant: "destructive",
          });
        }
      };

      // Enhanced configuration for better mobile support
      const config = {
        fps: deviceType === 'mobile' ? 10 : 15,
        qrbox: deviceType === 'mobile' 
          ? { width: 200, height: 200 } 
          : { width: 300, height: 300 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        videoConstraints: deviceType === 'mobile' ? {
          facingMode: 'environment' // Use back camera on mobile
        } : undefined
      };

      await scannerRef.current.start(
        cameraId,
        config,
        qrCodeSuccessCallback,
        (errorMessage: string) => {
          if (isScanning) {
            console.debug('QR Scan error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error('Error starting scanner:', error);
      toast({
        title: "Camera Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to start QR scanner. Please check camera permissions.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    await cleanupScanner();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {deviceType === 'mobile' ? <Smartphone className="mr-2" /> : <Monitor className="mr-2" />}
            QR Code Scanner - {deviceType === 'mobile' ? 'Mobile' : 'Desktop'} Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasPermission && (
            <div className="mb-4 p-4 bg-yellow-100 rounded-md flex items-center">
              <AlertCircle className="mr-2 text-yellow-600" />
              <p className="text-yellow-800">
                Camera access is required for QR scanning. 
                Please allow camera access when prompted.
              </p>
            </div>
          )}
          
          {availableCameras.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Camera:</label>
              <select 
                value={selectedCamera} 
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={isScanning}
              >
                {availableCameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div id="qr-reader" className="mb-4 w-full" />
          
          <Button
            onClick={isScanning ? stopScanner : initializeScanner}
            variant={isScanning ? "destructive" : "default"}
            className="w-full"
          >
            <Camera className="mr-2" size={20} />
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>

          {userDetails && (
            <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3">User Details:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><strong>ID:</strong> {userDetails.public_id}</div>
                <div><strong>Name:</strong> {userDetails.name}</div>
                <div><strong>NIC:</strong> {userDetails.nic}</div>
                <div><strong>Mobile:</strong> {userDetails.mobile}</div>
                <div><strong>Address:</strong> {userDetails.address}</div>
                <div><strong>Email:</strong> {userDetails.email || 'N/A'}</div>
                <div><strong>Department:</strong> {userDetails.department_name || 'N/A'}</div>
                <div><strong>Division:</strong> {userDetails.division_name || 'N/A'}</div>
              </div>
            </div>
          )}

          {lastScan && !userDetails && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="font-semibold text-blue-800">Last Scan Result:</h3>
              <p>ID: {lastScan.public_id}</p>
              <p>Timestamp: {new Date(lastScan.timestamp).toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;
