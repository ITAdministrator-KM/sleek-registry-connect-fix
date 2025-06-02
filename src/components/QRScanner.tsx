
import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [scanResult, setScanResult] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [serviceForm, setServiceForm] = useState({
    scan_purpose: '',
    scan_location: '',
    notes: ''
  });
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkCameraPermission();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera Not Supported",
          description: "Your browser doesn't support camera access. Please use a modern browser.",
          variant: "destructive",
        });
        setCameraPermission('denied');
        return;
      }

      // Try to get camera devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length === 0) {
        toast({
          title: "No Camera Found",
          description: "No camera devices detected. Please connect a camera and refresh the page.",
          variant: "destructive",
        });
        setCameraPermission('denied');
        return;
      }

      setAvailableCameras(cameras);
      
      // Test camera permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        setCameraPermission('granted');
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Camera permission error:', error);
        setCameraPermission('denied');
        toast({
          title: "Camera Permission Required",
          description: "Please allow camera access to use the QR scanner.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking camera:', error);
      setCameraPermission('denied');
    }
  };

  const startScanning = async () => {
    if (cameraPermission !== 'granted') {
      await checkCameraPermission();
      if (cameraPermission !== 'granted') {
        return;
      }
    }

    try {
      setIsScanning(true);
      
      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        videoConstraints: {
          facingMode: 'environment',
          advanced: [{ focusMode: 'continuous' }]
        }
      };

      scannerRef.current = new Html5QrcodeScanner('qr-reader', config, false);
      
      scannerRef.current.render(
        (decodedText: string, decodedResult: any) => {
          handleScanSuccess(decodedText, decodedResult);
        },
        (error: string) => {
          // Ignore frequent scanning errors
          if (!error.includes('NotFoundException')) {
            console.warn('QR Scan Error:', error);
          }
        }
      );

      toast({
        title: "Scanner Started",
        description: "Point your camera at a QR code to scan",
      });

    } catch (error) {
      console.error('Error starting scanner:', error);
      setIsScanning(false);
      toast({
        title: "Scanner Error",
        description: "Failed to start scanner. Please check camera permissions.",
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

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    console.log('QR Code scanned:', decodedText);
    setScanResult(decodedText);
    
    try {
      const parsedData = JSON.parse(decodedText);
      setScannedData(parsedData);
      
      toast({
        title: "QR Code Scanned Successfully",
        description: `Scanned data for: ${parsedData.name || 'Unknown'}`,
      });
      
      stopScanning();
    } catch (error) {
      // Not JSON data, treat as plain text
      setScannedData({ raw_data: decodedText });
      toast({
        title: "QR Code Scanned",
        description: "Raw QR code data captured",
      });
      stopScanning();
    }
  };

  const recordScan = async () => {
    if (!scannedData) {
      toast({
        title: "No Scan Data",
        description: "Please scan a QR code first",
        variant: "destructive",
      });
      return;
    }

    try {
      const staffUserId = localStorage.getItem('userId');
      const publicUserId = scannedData.id || scannedData.public_id || scannedData.raw_data;

      if (!staffUserId) {
        toast({
          title: "Authentication Error",
          description: "Staff user not authenticated",
          variant: "destructive",
        });
        return;
      }

      await apiService.recordQRScan({
        public_user_id: parseInt(publicUserId) || 0,
        staff_user_id: parseInt(staffUserId),
        scan_purpose: serviceForm.scan_purpose,
        scan_location: serviceForm.scan_location,
        scan_data: JSON.stringify({ ...scannedData, notes: serviceForm.notes })
      });

      setScanHistory(prev => [{
        ...scannedData,
        scan_time: new Date().toISOString(),
        purpose: serviceForm.scan_purpose,
        location: serviceForm.scan_location
      }, ...prev]);

      toast({
        title: "Scan Recorded",
        description: "QR scan has been recorded successfully",
      });

      // Reset form
      setServiceForm({ scan_purpose: '', scan_location: '', notes: '' });
      setScannedData(null);
      setScanResult('');

    } catch (error) {
      console.error('Error recording scan:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to record QR scan",
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
                QR Code Scanner
              </CardTitle>
              <CardDescription>
                Scan QR codes from ID cards to access public user information
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {cameraPermission === 'granted' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {cameraPermission === 'denied' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              
              {!isScanning ? (
                <Button 
                  onClick={startScanning}
                  disabled={cameraPermission !== 'granted'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanner
                </Button>
              ) : (
                <Button 
                  onClick={stopScanning}
                  variant="destructive"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  Stop Scanner
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div 
                id="qr-reader" 
                className={`w-full ${isScanning ? 'block' : 'hidden'}`}
                style={{ minHeight: '300px' }}
              />
              
              {!isScanning && cameraPermission === 'denied' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h3>
                  <p className="text-gray-500 mb-4">
                    Please allow camera access to use the QR scanner
                  </p>
                  <Button onClick={checkCameraPermission} variant="outline">
                    Check Camera Permission
                  </Button>
                </div>
              )}
              
              {!isScanning && cameraPermission === 'granted' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Scan</h3>
                  <p className="text-gray-500 mb-4">
                    Click "Start Scanner" to begin scanning QR codes
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {scannedData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Scanned Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {scannedData.name && (
                      <div><strong>Name:</strong> {scannedData.name}</div>
                    )}
                    {scannedData.nic && (
                      <div><strong>NIC:</strong> {scannedData.nic}</div>
                    )}
                    {scannedData.mobile && (
                      <div><strong>Mobile:</strong> {scannedData.mobile}</div>
                    )}
                    {scannedData.address && (
                      <div><strong>Address:</strong> {scannedData.address}</div>
                    )}
                    {scannedData.id && (
                      <div><strong>Public ID:</strong> {scannedData.id}</div>
                    )}
                    {scannedData.raw_data && (
                      <div><strong>Raw Data:</strong> {scannedData.raw_data}</div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Information</CardTitle>
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
                    disabled={!scannedData}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Record Service Visit
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
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{scan.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{scan.purpose}</p>
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

export default QRScanner;
