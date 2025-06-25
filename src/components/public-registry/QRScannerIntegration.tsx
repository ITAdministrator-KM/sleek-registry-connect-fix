
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRScanResult {
  public_id: string;
  name: string;
  nic: string;
  mobile: string;
  address: string;
}

interface QRScannerIntegrationProps {
  onScanResult: (data: QRScanResult) => void;
  isActive: boolean;
}

export const QRScannerIntegration: React.FC<QRScannerIntegrationProps> = ({
  onScanResult,
  isActive
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isActive && isScanning) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isActive, isScanning]);

  // Listen for keyboard input from QR scanner
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isScanning || !inputRef.current) return;

      // Most QR scanners end input with Enter
      if (event.key === 'Enter') {
        const scannedData = inputRef.current.value.trim();
        if (scannedData) {
          processScannedData(scannedData);
          inputRef.current.value = ''; // Clear for next scan
        }
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [isScanning]);

  const startScanning = () => {
    setIsScanning(true);
    setScanStatus('scanning');
    // Focus on hidden input to capture scanner input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    setScanStatus('idle');
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const processScannedData = (data: string) => {
    try {
      // Try to parse as JSON first (our QR code format)
      let parsedData: QRScanResult;
      
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.public_id && jsonData.name && jsonData.nic) {
          parsedData = {
            public_id: jsonData.public_id,
            name: jsonData.name,
            nic: jsonData.nic,
            mobile: jsonData.mobile || '',
            address: jsonData.address || ''
          };
        } else {
          throw new Error('Invalid QR data format');
        }
      } catch {
        // If not JSON, try to parse as simple text
        // Assume format: PUBLIC_ID|NAME|NIC|MOBILE|ADDRESS
        const parts = data.split('|');
        if (parts.length >= 3) {
          parsedData = {
            public_id: parts[0],
            name: parts[1],
            nic: parts[2],
            mobile: parts[3] || '',
            address: parts[4] || ''
          };
        } else {
          throw new Error('Unrecognized QR code format');
        }
      }

      setScanStatus('success');
      setLastScanTime(new Date());
      
      toast({
        title: "QR Code Scanned",
        description: `Successfully scanned ID: ${parsedData.public_id}`,
      });

      onScanResult(parsedData);

      // Reset status after 2 seconds
      setTimeout(() => {
        setScanStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Error processing scanned data:', error);
      setScanStatus('error');
      
      toast({
        title: "Scan Error",
        description: "Invalid QR code format. Please try again.",
        variant: "destructive",
      });

      // Reset status after 3 seconds
      setTimeout(() => {
        setScanStatus('idle');
      }, 3000);
    }
  };

  const getStatusIcon = () => {
    switch (scanStatus) {
      case 'scanning':
        return <Scan className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Scan className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (scanStatus) {
      case 'scanning':
        return 'Scanning... Point QR code at scanner';
      case 'success':
        return `Scanned successfully ${lastScanTime?.toLocaleTimeString()}`;
      case 'error':
        return 'Scan failed. Please try again';
      default:
        return isScanning ? 'Ready to scan' : 'Scanner inactive';
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          QR Scanner Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600">{getStatusText()}</p>
            {lastScanTime && (
              <p className="text-xs text-gray-400 mt-1">
                Last scan: {lastScanTime.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={isScanning ? "destructive" : "default"}
              size="sm"
              onClick={() => isScanning ? stopScanning() : startScanning()}
            >
              {isScanning ? 'Stop Scanner' : 'Start Scanner'}
            </Button>
          </div>
        </div>
        
        {/* Hidden input to capture scanner data */}
        <input
          ref={inputRef}
          type="text"
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            opacity: 0,
            pointerEvents: 'none'
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
      </CardContent>
    </Card>
  );
};

export default QRScannerIntegration;
