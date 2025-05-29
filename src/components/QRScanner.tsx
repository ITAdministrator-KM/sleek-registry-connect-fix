
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Monitor, Smartphone, AlertCircle, RefreshCw } from 'lucide-react';

interface ScanResult {
  id: string;
  name: string;
  nic: string;
  mobile: string;
  issued: string;
  authority: string;
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
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [userDetails, setUserDetails] = useState<PublicUserDetails | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    detectDeviceType();
    initializeCameraSystem();
    
    return () => {
      cleanupScanner();
    };
  }, []);

  const detectDeviceType = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
  };

  const initializeCameraSystem = async () => {
    try {
      setIsInitializing(true);
      await requestCameraPermission();
      await fetchAvailableCameras();
    } catch (error) {
      console.error('Failed to initialize camera system:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      setPermissionRequested(true);
      
      // Try navigator.permissions API first
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasPermission(permission.state === 'granted');
        
        permission.addEventListener('change', () => {
          setHasPermission(permission.state === 'granted');
        });
        
        if (permission.state === 'granted') {
          return true;
        }
      }
      
      // Fallback: Request camera access directly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: deviceType === 'mobile' ? 'environment' : 'user' 
        } 
      });
      
      // Stop the stream immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
      
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Camera Permission Denied",
            description: "Please allow camera access in your browser settings to use QR scanning.",
            variant: "destructive",
          });
        } else if (error.name === 'NotFoundError') {
          toast({
            title: "No Camera Found",
            description: "No camera devices found. Please connect a camera or USB QR scanner.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Camera Error",
            description: `Camera access failed: ${error.message}`,
            variant: "destructive",
          });
        }
      }
      return false;
    }
  };

  const fetchAvailableCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      console.log('Available cameras:', devices);
      setAvailableCameras(devices);
      
      if (devices.length > 0) {
        // Smart camera selection
        let preferredCamera = devices[0];
        
        if (deviceType === 'mobile') {
          // For mobile, prefer back camera
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('environment')
          );
          if (backCamera) preferredCamera = backCamera;
        } else {
          // For desktop, prefer USB scanners or external cameras
          const usbScanner = devices.find(device => 
            device.label.toLowerCase().includes('usb') ||
            device.label.toLowerCase().includes('scanner') ||
            device.label.toLowerCase().includes('external')
          );
          if (usbScanner) preferredCamera = usbScanner;
        }
        
        setSelectedCamera(preferredCamera.id);
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
      toast({
        title: "Camera Detection Failed",
        description: "Could not detect available cameras. Please check your device connections.",
        variant: "destructive",
      });
    }
  };

  const cleanupScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
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
        toast({
          title: "User Found",
          description: `Successfully loaded details for ${user.name}`,
        });
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
      setIsInitializing(true);
      
      if (!hasPermission) {
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) {
          return;
        }
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      if (availableCameras.length === 0) {
        await fetchAvailableCameras();
      }

      if (availableCameras.length === 0) {
        throw new Error("No camera devices available");
      }

      const cameraId = selectedCamera || availableCameras[0].id;

      const qrCodeSuccessCallback = async (decodedText: string) => {
        try {
          let result: ScanResult;
          
          // Try to parse as JSON first (our QR format)
          try {
            const parsed = JSON.parse(decodedText);
            result = {
              id: parsed.id || parsed.public_id || decodedText,
              name: parsed.name || '',
              nic: parsed.nic || '',
              mobile: parsed.mobile || '',
              issued: parsed.issued || '',
              authority: parsed.authority || ''
            };
          } catch {
            // If not JSON, assume it's a public_id string
            result = {
              id: decodedText,
              name: '',
              nic: '',
              mobile: '',
              issued: '',
              authority: ''
            };
          }
          
          setLastScan(result);
          
          // Fetch full user details
          await fetchUserDetails(result.id);
          
          // Record the scan
          try {
            await apiService.recordQRScan({
              public_user_id: parseInt(result.id.replace(/\D/g, ''), 10) || 1,
              staff_user_id: parseInt(localStorage.getItem('userId') || '1', 10),
              scan_purpose: 'verification',
              scan_location: deviceType === 'mobile' ? 'mobile_device' : 'office_desktop'
            });
          } catch (recordError) {
            console.warn('Failed to record scan:', recordError);
          }

        } catch (error) {
          console.error('Error processing QR code:', error);
          toast({
            title: "Scan Error",
            description: "Invalid QR code format or failed to process",
            variant: "destructive",
          });
        }
      };

      // Enhanced configuration for better compatibility
      const config = {
        fps: deviceType === 'mobile' ? 10 : 15,
        qrbox: deviceType === 'mobile' 
          ? { width: 250, height: 250 } 
          : { width: 300, height: 300 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        videoConstraints: deviceType === 'mobile' ? {
          facingMode: 'environment',
          advanced: [{ focusMode: 'continuous' }]
        } : {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          focusMode: 'continuous'
        }
      };

      await scannerRef.current.start(
        cameraId,
        config,
        qrCodeSuccessCallback,
        (errorMessage: string) => {
          // Only log significant errors, not normal scanning messages
          if (!errorMessage.includes('No QR code found')) {
            console.debug('QR Scan message:', errorMessage);
          }
        }
      );

      setIsScanning(true);
      toast({
        title: "Scanner Started",
        description: "QR scanner is now active. Point camera at QR code.",
      });

    } catch (error) {
      console.error('Error starting scanner:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      toast({
        title: "Scanner Error",
        description: `Failed to start QR scanner: ${errorMessage}`,
        variant: "destructive",
      });
      setIsScanning(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    await cleanupScanner();
    toast({
      title: "Scanner Stopped",
      description: "QR scanner has been stopped.",
    });
  };

  const refreshCameras = async () => {
    setIsInitializing(true);
    await fetchAvailableCameras();
    setIsInitializing(false);
    toast({
      title: "Cameras Refreshed",
      description: "Camera list has been updated.",
    });
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
          {hasPermission === false && (
            <div className="mb-4 p-4 bg-red-100 rounded-md flex items-center">
              <AlertCircle className="mr-2 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Camera Access Required</p>
                <p className="text-red-700 text-sm">
                  Please allow camera access in your browser settings and refresh the page.
                </p>
                <Button 
                  onClick={requestCameraPermission} 
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Request Permission
                </Button>
              </div>
            </div>
          )}

          {hasPermission === null && !permissionRequested && (
            <div className="mb-4 p-4 bg-yellow-100 rounded-md flex items-center">
              <AlertCircle className="mr-2 text-yellow-600" />
              <p className="text-yellow-800">
                Camera permission status unknown. Click "Start Scanning" to request access.
              </p>
            </div>
          )}
          
          {availableCameras.length > 1 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Select Camera:</label>
                <Button 
                  onClick={refreshCameras} 
                  variant="outline" 
                  size="sm"
                  disabled={isInitializing || isScanning}
                >
                  <RefreshCw className={`mr-1 h-3 w-3 ${isInitializing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <select 
                value={selectedCamera} 
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={isScanning || isInitializing}
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
            disabled={isInitializing}
          >
            <Camera className="mr-2" size={20} />
            {isInitializing ? "Initializing..." : isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>

          {userDetails && (
            <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3">✅ User Details Verified:</h3>
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
              <h3 className="font-semibold text-blue-800">📱 Last Scan Result:</h3>
              <p><strong>ID:</strong> {lastScan.id}</p>
              {lastScan.name && <p><strong>Name:</strong> {lastScan.name}</p>}
              {lastScan.nic && <p><strong>NIC:</strong> {lastScan.nic}</p>}
              <p><strong>Scanned:</strong> {new Date().toLocaleString()}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Scanner Info:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Device: {deviceType === 'mobile' ? 'Mobile/Tablet' : 'Desktop/PC'}</li>
              <li>• Cameras detected: {availableCameras.length}</li>
              <li>• Permission: {hasPermission ? '✅ Granted' : hasPermission === false ? '❌ Denied' : '⏳ Pending'}</li>
              <li>• Status: {isScanning ? '🟢 Active' : '🔴 Stopped'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;
