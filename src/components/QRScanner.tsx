import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ScanResult {
  public_id: string;
  name: string;
  nic: string;
  timestamp: number;
}

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  // Check camera permissions on mount
  useEffect(() => {
    checkCameraPermission();
    return () => {
      cleanupScanner();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setHasPermission(permission.state === 'granted');
      
      permission.addEventListener('change', () => {
        setHasPermission(permission.state === 'granted');
      });
    } catch (error) {
      console.error('Error checking camera permission:', error);
      // Fall back to requesting permission directly
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

  const initializeScanner = async () => {
    try {
      // Check and request camera permission if needed
      if (!hasPermission) {
        await checkCameraPermission();
        if (!hasPermission) {
          throw new Error("Camera permission denied");
        }
      }

      // Initialize scanner if not already initialized
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("No camera devices found");
      }

      // QR Code success callback
      const qrCodeSuccessCallback = async (decodedText: string) => {
        try {
          const result = JSON.parse(decodedText) as ScanResult;
          setLastScan(result);
          
          // Record the scan
          await apiService.recordQRScan({
            public_user_id: parseInt(result.public_id.replace('PUB', ''), 10),
            staff_user_id: 1, // Replace with actual staff ID from context
            scan_purpose: 'verification',
            scan_location: 'office'
          });

          toast({
            title: "Success",
            description: `Scanned ID: ${result.public_id}`,
          });
        } catch (error) {
          console.error('Error processing QR code:', error);
          toast({
            title: "Error",
            description: "Invalid QR code format",
            variant: "destructive",
          });
        }
      };

      // Scanner configuration
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      };

      // Start the scanner
      await scannerRef.current.start(
        { deviceId: devices[0].id },
        config,
        qrCodeSuccessCallback,
        (errorMessage: string) => {
          // Only log scanning errors if we're still scanning
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
    <Card>
      <CardHeader>
        <CardTitle>QR Code Scanner</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasPermission && (
          <div className="mb-4 p-4 bg-yellow-100 rounded-md">
            <p className="text-yellow-800">
              Camera access is required for QR scanning. 
              Please allow camera access when prompted.
            </p>
          </div>
        )}
        
        <div id="qr-reader" className="mb-4" />
        
        <Button
          onClick={isScanning ? stopScanner : initializeScanner}
          variant={isScanning ? "destructive" : "default"}
        >
          {isScanning ? "Stop Scanning" : "Start Scanning"}
        </Button>

        {lastScan && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <h3 className="font-semibold">Last Scan Result:</h3>
            <p>ID: {lastScan.public_id}</p>
            <p>Name: {lastScan.name}</p>
            <p>NIC: {lastScan.nic}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;
