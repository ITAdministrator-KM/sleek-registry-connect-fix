
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Search, User } from 'lucide-react';
import { apiService } from '@/services/apiService';

interface QRCodeScannerProps {
  onUserScanned: (user: any) => void;
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onUserScanned, onClose }) => {
  const [scannedData, setScannedData] = useState('');
  const [manualId, setManualId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleScan = async (data: string) => {
    try {
      setIsLoading(true);
      let publicId = '';
      
      // Try to parse as JSON first (QR code data)
      try {
        const parsed = JSON.parse(data);
        publicId = parsed.public_id || parsed.id;
      } catch {
        // If not JSON, assume it's a direct public ID
        publicId = data;
      }
      
      if (!publicId) {
        throw new Error('Invalid QR code or ID format');
      }
      
      // Fetch user data from API
      const users = await apiService.getPublicUsers();
      const user = users.find(u => 
        u.public_id === publicId || 
        u.id === parseInt(publicId) ||
        u.id.toString() === publicId
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      onUserScanned(user);
      toast({
        title: "Success",
        description: `User ${user.name} found and loaded`,
      });
      
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to scan QR code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (manualId.trim()) {
      handleScan(manualId.trim());
    }
  };

  const startCamera = () => {
    setIsScanning(true);
    // Initialize camera scanning here
    toast({
      title: "Camera Started",
      description: "Point the camera at the QR code",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Scan Public ID
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Button 
            onClick={startCamera} 
            disabled={isScanning}
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Start Camera Scan'}
          </Button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="manual-id">Enter Public ID Manually</Label>
          <div className="flex gap-2">
            <Input
              id="manual-id"
              placeholder="Enter Public ID (e.g., PUB00001)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
            />
            <Button 
              onClick={handleManualSearch} 
              disabled={!manualId.trim() || isLoading}
              size="sm"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {scannedData && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Scanned Data:</p>
            <p className="text-sm font-mono break-all">{scannedData}</p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
