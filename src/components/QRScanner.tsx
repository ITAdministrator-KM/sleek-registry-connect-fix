import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Camera, Usb, CheckCircle, XCircle, AlertTriangle, RefreshCw, User, Building, Calendar, Hash } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface ScanResult {
  id: string;
  data: string;
  timestamp: string;
  status: 'success' | 'error';
  userInfo?: {
    name: string;
    nic: string;
    department: string;
    division: string;
    public_id?: string;
  };
}

interface QRData {
  id?: string;
  publicUserId?: number;
  public_id?: string;
  name: string;
  nic: string;
  mobile?: string;
  email?: string;
  issued?: string;
  authority?: string;
  type?: string;
  verified?: boolean;
  department?: string;
  division?: string;
}

interface QRScanData {
  public_user_id: number;
  staff_user_id: number;
  scan_purpose: string;
  scan_location: string;
  scan_data?: string;
}

const QRScanner = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scannerMode, setScannerMode] = useState<'camera' | 'usb'>('camera');
  const [autoDetect, setAutoDetect] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<Array<{id: string, label: string}>>([]);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementId = "qr-reader";
  const { toast } = useToast();

  // Handle both camera and USB scanner input formats
  const qrConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    // Support more barcode formats for USB scanners
    formatsToSupport: [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
    ],
    // Enable both camera and USB scanner inputs
    supportedScanTypes: [
      Html5QrcodeScanType.SCAN_TYPE_CAMERA,
      Html5QrcodeScanType.SCAN_TYPE_FILE,
    ],
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    }
  };

  useEffect(() => {
    if (autoDetect) {
      detectDeviceType();
    }
    return () => {
      stopScanner();
    };
  }, [autoDetect]);

  const detectDeviceType = async () => {
    try {
      setIsLoading(true);
      setError('');

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // For mobile devices, prefer rear camera
      if (isMobile) {
        setScannerMode('camera');
        // Try to get rear camera if available
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Try to find rear-facing camera
        const rearCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (rearCamera) {
          setSelectedCamera(rearCamera.deviceId);
        } else if (videoDevices.length > 0) {
          // Fall back to first available camera
          setSelectedCamera(videoDevices[0].deviceId);
        }

        setAvailableCameras(videoDevices.map(device => ({
          id: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}...`
        })));
        
        await requestCameraPermission();
      } else {
        // Desktop behavior
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        setAvailableCameras(videoDevices.map(device => ({
          id: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}...`
        })));

        // Check for USB scanners or webcams
        const usbScanner = videoDevices.find(device => 
          device.label.toLowerCase().includes('scanner') ||
          device.label.toLowerCase().includes('barcode') ||
          device.label.toLowerCase().includes('qr')
        );
        
        if (usbScanner) {
          setScannerMode('usb');
          setSelectedCamera(usbScanner.deviceId);
        } else if (videoDevices.length > 0) {
          setScannerMode('camera');
          setSelectedCamera(videoDevices[0].deviceId);
        } else {
          setError('No camera or scanner devices found');
        }

        await requestCameraPermission();
      }
    } catch (error) {
      console.error('Error detecting device type:', error);
      setError('Failed to detect devices. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissionStatus.state === 'denied') {
          setPermission('denied');
          throw new Error('Camera access is blocked. Please allow camera access in your browser settings.');
        }
      }

      // Try to get camera stream with optimal mobile settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: scannerMode === 'camera' ? 'environment' : undefined,
          // Add recommended mobile camera constraints
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 1.777778 },
          frameRate: { ideal: 30 }
        }
      });
      
      // Camera access granted
      setPermission('granted');
      // Always stop the stream after permission check
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera permission error:', error);
      setPermission('denied');
      setError(error instanceof Error ? error.message : 'Failed to access camera. Please check permissions.');
    }
  };

  const startScanner = async () => {
    if (isScanning) return;

    try {
      setIsLoading(true);
      setError('');
      
      if (permission !== 'granted') {
        await requestCameraPermission();
        if (permission === 'denied') {
          throw new Error('Camera permission required');
        }
      }

      stopScanner();

      // Determine if running on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Configure scanner based on device type
      const config = {
        fps: isMobile ? 15 : 10, // Higher FPS for mobile
        qrbox: isMobile 
          ? { width: Math.min(250, window.innerWidth - 50), height: Math.min(250, window.innerWidth - 50) }
          : { width: 300, height: 300 },
        aspectRatio: isMobile ? 1.777778 : 1.0,
        supportedScanTypes: [
          Html5QrcodeScanType.SCAN_TYPE_CAMERA,
          ...(scannerMode === 'usb' ? [Html5QrcodeScanType.SCAN_TYPE_FILE] : [])
        ],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          ...(scannerMode === 'usb' ? [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13
          ] : [])
        ],
        videoConstraints: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: scannerMode === 'camera' ? 'environment' : undefined,
          width: isMobile ? { ideal: 1920 } : { ideal: 1280 },
          height: isMobile ? { ideal: 1080 } : { ideal: 720 },
          frameRate: isMobile ? { ideal: 30 } : { ideal: 24 }
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      scannerRef.current = new Html5QrcodeScanner(scannerElementId, config, false);
      
      scannerRef.current.render(
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText, decodedResult);
        },
        (error) => {
          // Only log non-standard errors
          if (!error.includes('NotFoundException')) {
            console.warn('QR Scan error:', error);
          }
        }
      );

      setIsScanning(true);
      toast({
        title: "Scanner Started",
        description: `${scannerMode === 'usb' ? 'USB Scanner' : 'Camera'} scanning active`,
      });
    } catch (error) {
      console.error('Failed to start scanner:', error);
      setError(`Failed to start scanner: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsScanning(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.warn('Error stopping scanner:', error);
      }
    }
    setIsScanning(false);
  };
  const handleScanSuccess = async (decodedText: string, decodedResult: any) => {
    try {
      console.log('QR scan successful:', decodedText);
      
      let qrData: QRData;
      try {
        qrData = JSON.parse(decodedText);
      } catch {
        // If not JSON, check if it's a public_id
        if (decodedText.match(/^PUB\d+$/)) {
          qrData = {
            public_id: decodedText,
            name: 'Unknown',
            nic: decodedText,
            type: 'public_user'
          };
        } else {
          throw new Error('Invalid QR code format');
        }
      }

      // Try to get public_id from different possible fields
      const publicId = qrData.public_id || qrData.id;
      
      if (!publicId) {
        throw new Error('QR code missing public ID');
      }

      // Record the scan result
      const result: ScanResult = {
        id: Date.now().toString(),
        data: decodedText,
        timestamp: new Date().toLocaleString(),
        status: 'success',
        userInfo: {
          name: qrData.name,
          nic: qrData.nic,
          department: qrData.department || 'N/A',
          division: qrData.division || 'N/A',
          public_id: publicId
        }
      };

      setScanResults(prev => [result, ...prev.slice(0, 9)]);

      // Record scan in backend if staff is logged in
      const staffUserId = localStorage.getItem('userId');
      if (staffUserId) {
        try {
          await apiService.recordQRScan({
            public_user_id: qrData.publicUserId || 0,
            staff_user_id: parseInt(staffUserId),
            scan_purpose: 'verification',
            scan_location: 'staff_dashboard',
            scan_data: JSON.stringify(qrData)
          });
        } catch (error) {
          console.error('Failed to record scan:', error);
        }
      }

      // Show success message
      toast({
        title: "QR Code Scanned",
        description: `Verified: ${qrData.name}`,
      });

      // Navigate to the public user's page
      navigate(`/qr-scan/${publicId}`);

    } catch (error) {
      console.error('Error processing scan result:', error);
      const errorResult: ScanResult = {
        id: Date.now().toString(),
        data: decodedText,
        timestamp: new Date().toLocaleString(),
        status: 'error'
      };
      setScanResults(prev => [errorResult, ...prev.slice(0, 9)]);
      
      toast({
        title: "Scan Error",
        description: "Invalid QR code format",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-600" size={20} />;
      case 'error': return <XCircle className="text-red-600" size={20} />;
      default: return <AlertTriangle className="text-yellow-600" size={20} />;
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted': return <Badge className="bg-green-100 text-green-800">✅ Granted</Badge>;
      case 'denied': return <Badge className="bg-red-100 text-red-800">❌ Denied</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">⏳ Prompt</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">QR Code Scanner</h2>
        <p className="text-gray-600 mt-2">Scan QR codes from ID cards and documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Controls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="text-blue-600" size={24} />
              <span>Scanner Controls</span>
            </CardTitle>
            <CardDescription>
              Configure and control the QR code scanner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Device Detection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-detect">Auto-detect devices</Label>
                <Switch
                  id="auto-detect"
                  checked={autoDetect}
                  onCheckedChange={setAutoDetect}
                />
              </div>

              {!autoDetect && (
                <Tabs value={scannerMode} onValueChange={(value) => setScannerMode(value as 'camera' | 'usb')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera">
                      <Camera className="mr-2" size={16} />
                      Camera
                    </TabsTrigger>
                    <TabsTrigger value="usb">
                      <Usb className="mr-2" size={16} />
                      USB Scanner
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {/* Camera Selection */}
              {availableCameras.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="camera-select">Select Camera/Scanner</Label>
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger id="camera-select">
                      <SelectValue placeholder="Choose device" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera) => (
                        <SelectItem key={camera.id} value={camera.id}>
                          {camera.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Permission Status */}
              <div className="flex items-center justify-between">
                <Label>Camera Permission</Label>
                {getPermissionStatus()}
              </div>
            </div>

            <Separator />

            {/* Error Display */}
            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Scanner Actions */}
            <div className="flex space-x-3">
              <Button
                onClick={startScanner}
                disabled={isScanning || isLoading || permission === 'denied'}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <RefreshCw className="mr-2 animate-spin" size={16} />
                ) : isScanning ? (
                  <QrCode className="mr-2" size={16} />
                ) : (
                  <Camera className="mr-2" size={16} />
                )}
                {isLoading ? 'Initializing...' : isScanning ? 'Scanning...' : 'Start Scanner'}
              </Button>
              
              <Button
                onClick={stopScanner}
                disabled={!isScanning}
                variant="outline"
                className="flex-1"
              >
                Stop Scanner
              </Button>
              
              <Button
                onClick={detectDeviceType}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />
              </Button>
            </div>

            {/* Scanner Display */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div id={scannerElementId} className="w-full" />
              {!isScanning && (
                <div className="text-center py-8 text-gray-500">
                  <QrCode size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Scanner is not active</p>
                  <p className="text-sm">Click "Start Scanner" to begin</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scan Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={20} />
              <span>Scan Results</span>
            </CardTitle>
            <CardDescription>Recent QR code scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanResults.length > 0 ? (
                scanResults.map((result) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      {getStatusIcon(result.status)}
                      <span className="text-xs text-gray-500">{result.timestamp}</span>
                    </div>
                    
                    {result.userInfo ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User size={14} className="text-blue-600" />
                          <span className="font-medium text-sm">{result.userInfo.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Hash size={14} className="text-gray-600" />
                          <span className="text-xs text-gray-600">{result.userInfo.nic}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building size={14} className="text-purple-600" />
                          <span className="text-xs text-gray-600">{result.userInfo.department}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 font-mono break-all">{result.data}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <QrCode size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No scans yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRScanner;
