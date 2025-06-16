
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface ResponsiveQRScannerProps {
  onScanSuccess: (result: string) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

const ResponsiveQRScanner = ({ onScanSuccess, onError, onClose }: ResponsiveQRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const scanner = new Html5QrcodeScanner("qr-reader", config, false);
    scannerRef.current = scanner;

    const onScanResult = (decodedText: string) => {
      scanner.clear();
      onScanSuccess(decodedText);
      setIsScanning(false);
    };

    const onScanFailure = (error: any) => {
      if (onError) {
        onError(error);
      }
    };

    scanner.render(onScanResult, onScanFailure);
    setIsScanning(true);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess, onError]);

  const handleStop = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      setIsScanning(false);
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Scan QR Code
        </h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={handleStop}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div id="qr-reader" className="w-full"></div>
      
      {isScanning && (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={handleStop}>
            Stop Scanning
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResponsiveQRScanner;
