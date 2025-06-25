
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/apiService';
import QRScannerIntegration from './QRScannerIntegration';
import { Camera, User, CheckCircle } from 'lucide-react';

interface ScanIDFlowProps {
  departments: any[];
  divisions: any[];
  onComplete: (result: any) => void;
}

const ScanIDFlow: React.FC<ScanIDFlowProps> = ({
  departments,
  divisions,
  onComplete
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<any>(null);
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    department_id: '',
    division_id: '',
    purpose_of_visit: '',
    remarks: ''
  });
  const { toast } = useToast();

  const handleQRScanResult = async (scanData: any) => {
    try {
      setLoading(true);
      
      // First try to find user by public_id
      const users = await apiService.getPublicUsers();
      const foundUser = users.find(u => u.public_id === scanData.public_id);
      
      if (foundUser) {
        setScannedUser(foundUser);
        setIsScanning(false);
        toast({
          title: "User Found",
          description: `Loaded details for ${foundUser.name}`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No matching user found in database",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a Public ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const users = await apiService.getPublicUsers();
      const foundUser = users.find(u => 
        u.public_id.toLowerCase().includes(manualId.toLowerCase()) ||
        u.nic.toLowerCase().includes(manualId.toLowerCase())
      );
      
      if (foundUser) {
        setScannedUser(foundUser);
        toast({
          title: "User Found",
          description: `Loaded details for ${foundUser.name}`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No matching user found",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrySubmit = async () => {
    if (!scannedUser || !formData.department_id || !formData.purpose_of_visit) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const result = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/registry/create-entry.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          visitor_id: scannedUser.id,
          visitor_name: scannedUser.name,
          visitor_nic: scannedUser.nic,
          visitor_phone: scannedUser.mobile,
          visitor_address: scannedUser.address,
          department_id: formData.department_id,
          division_id: formData.division_id,
          purpose_of_visit: formData.purpose_of_visit,
          remarks: formData.remarks,
          entry_time: new Date().toISOString(),
          status: 'active'
        })
      });

      if (result.ok) {
        const registryData = await result.json();
        onComplete({
          type: 'scan-id',
          publicUser: scannedUser,
          registryData,
          autoGenerateToken: true
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create registry entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!scannedUser ? (
        <div className="space-y-4">
          <QRScannerIntegration
            onScanResult={handleQRScanResult}
            isActive={isScanning}
          />
          
          <div className="flex gap-2">
            <Button
              onClick={() => setIsScanning(!isScanning)}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isScanning ? 'Stop Scanner' : 'Start QR Scanner'}
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
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter Public ID or NIC"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              className="flex-1"
            />
            <Button onClick={handleManualSearch} disabled={loading}>
              Search
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">User Identified</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Name:</Label>
                  <p>{scannedUser.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Public ID:</Label>
                  <p>{scannedUser.public_id}</p>
                </div>
                <div>
                  <Label className="font-medium">NIC:</Label>
                  <p>{scannedUser.nic}</p>
                </div>
                <div>
                  <Label className="font-medium">Mobile:</Label>
                  <p>{scannedUser.mobile}</p>
                </div>
                <div className="col-span-2">
                  <Label className="font-medium">Address:</Label>
                  <p>{scannedUser.address}</p>
                </div>
              </div>
              
              <Button
                onClick={() => setScannedUser(null)}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Scan Different ID
              </Button>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scan-department">Department *</Label>
              <Select value={formData.department_id} onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}>
                <SelectTrigger id="scan-department">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scan-division">Division</Label>
              <Select value={formData.division_id} onValueChange={(value) => setFormData(prev => ({ ...prev, division_id: value }))}>
                <SelectTrigger id="scan-division">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((div) => (
                    <SelectItem key={div.id} value={div.id.toString()}>
                      {div.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="scan-purpose">Purpose of Visit *</Label>
            <Input
              id="scan-purpose"
              name="purpose"
              autoComplete="off"
              value={formData.purpose_of_visit}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="scan-remarks">Remarks</Label>
            <Textarea
              id="scan-remarks"
              name="remarks"
              autoComplete="off"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            />
          </div>
          
          <Button onClick={handleRegistrySubmit} disabled={loading} className="w-full">
            {loading ? 'Creating Entry...' : 'Submit Entry & Generate Token'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScanIDFlow;
