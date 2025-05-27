import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Download, Search, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from "@/hooks/use-toast";

import { apiService } from '@/services/api';

interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email?: string;
  photo?: string;
  department_id?: number;
  division_id?: number;
  department_name?: string;
  division_name?: string;
  created_at: string;
  status: string;
}

const IDCardGenerator = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublicUsers();
  }, []);

  const fetchPublicUsers = async () => {
    try {
      setIsLoading(true);
      const users = await apiService.getPublicUsers();
      setPublicUsers(users);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch public users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = publicUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nic.includes(searchTerm)
  );

  const generateQRCode = async (user: PublicUser) => {
    try {
      const qrData = JSON.stringify({
        id: user.public_id,
        name: user.name,
        nic: user.nic,
        timestamp: Date.now()
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
      return '';
    }
  };

  const handleGenerateCard = async (user: PublicUser) => {
    setSelectedUser(user);
    await generateQRCode(user);
    setIsDialogOpen(true);
  };

  const downloadAsImage = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `id-card-${selectedUser?.public_id}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "Success",
        description: "ID card downloaded as image",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const downloadAsPDF = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', [85.6, 54]); // Credit card size
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
      pdf.save(`id-card-${selectedUser?.public_id}.pdf`);
      
      toast({
        title: "Success",
        description: "ID card downloaded as PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const printCard = () => {
    if (!cardRef.current) return;
    
    const printContent = cardRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print ID Card</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              @media print {
                body { margin: 0; padding: 0; }
                .id-card { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800">ID Card Generator</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search public users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{user.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Public ID:</strong> {user.public_id}</p>
                  <p><strong>NIC:</strong> {user.nic}</p>
                  <p><strong>Mobile:</strong> {user.mobile}</p>
                </div>
                <Button
                  onClick={() => handleGenerateCard(user)}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="mr-2" size={16} />
                  Generate ID Card
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ID Card Preview - {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* ID Card Design */}
            <div ref={cardRef} className="mx-auto">
              <div className="w-[340px] h-[214px] bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden relative id-card">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-2 flex items-center justify-between">
                  <img 
                    src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
                    alt="DSK Logo" 
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="text-center">
                    <h4 className="text-xs font-bold">DIVISIONAL SECRETARIAT</h4>
                    <p className="text-xs">KALMUNAI</p>
                  </div>
                  <img 
                    src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
                    alt="DSK Logo" 
                    className="h-8 w-8 rounded-full"
                  />
                </div>

                {/* Main Content */}
                <div className="p-3 flex">
                  {/* Photo Section */}
                  <div className="w-16 h-20 bg-gray-200 border border-gray-300 mr-3 flex items-center justify-center overflow-hidden">
                    {selectedUser?.photo ? (
                      <img 
                        src={selectedUser.photo} 
                        alt="Photo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                          toast({
                            title: "Warning",
                            description: "Failed to load user photo",
                            variant: "destructive",
                          });
                        }}
                      />
                    ) : (
                      <img 
                        src="/placeholder.svg" 
                        alt="No Photo"
                        className="w-12 h-12 opacity-50" 
                      />
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="flex-1 text-xs space-y-1">
                    <div>
                      <span className="font-bold">ID:</span> {selectedUser?.public_id}
                    </div>
                    <div>
                      <span className="font-bold">Name:</span> {selectedUser?.name}
                    </div>
                    <div>
                      <span className="font-bold">NIC:</span> {selectedUser?.nic}
                    </div>
                    <div>
                      <span className="font-bold">Address:</span> {selectedUser?.address}
                    </div>
                    <div>
                      <span className="font-bold">Mobile:</span> {selectedUser?.mobile}
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="w-16 h-16 border border-gray-300 flex items-center justify-center">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                    ) : (
                      <span className="text-xs text-gray-500">QR</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-gray-100 p-1 text-center">
                  <p className="text-xs text-gray-600">Valid Government ID Card</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button onClick={downloadAsImage} variant="outline">
                <Download className="mr-2" size={16} />
                Download PNG
              </Button>
              <Button onClick={downloadAsPDF} variant="outline">
                <Download className="mr-2" size={16} />
                Download PDF
              </Button>
              <Button onClick={printCard} className="bg-green-600 hover:bg-green-700">
                <Printer className="mr-2" size={16} />
                Print Card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IDCardGenerator;
