
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import type { PublicUser } from '@/services/api';
import { Search, Printer, AlertCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CARD_WIDTH = 85.6;
const CARD_HEIGHT = 54;

const IDCardGenerator = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PublicUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nic.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getPublicUsers();
      setUsers(response);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const validateQRCode = (qrCode: string): boolean => {
    if (!qrCode) return false;
    return qrCode.startsWith('data:image/png;base64,') || 
           qrCode.startsWith('data:image/jpeg;base64,');
  };

  const createCardContent = (user: PublicUser): HTMLDivElement => {
    const cardContent = document.createElement('div');
    const qrCodeValid = validateQRCode(user.qr_code || '');
    
    cardContent.innerHTML = `
      <div style="width: ${CARD_WIDTH}mm; height: ${CARD_HEIGHT}mm; padding: 4mm; font-family: Arial, sans-serif; border: 2px solid #000; border-radius: 3mm; background: white; position: relative; box-sizing: border-box;">
        <!-- Header with logos and title -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3mm; border-bottom: 1px solid #333; padding-bottom: 2mm;">
          <img src="/lovable-uploads/e73a2c54-9e18-43f7-baf6-bfb62be56894.png" style="width: 10mm; height: 10mm; object-fit: contain;" alt="Logo 1" />
          <div style="text-align: center; flex: 1; padding: 0 2mm;">
            <h2 style="margin: 0; font-size: 11px; font-weight: bold; color: #000; line-height: 1.1;">Divisional Secretariat</h2>
            <h3 style="margin: 0; font-size: 10px; font-weight: bold; color: #000; margin-top: 1mm;">Kalmunai</h3>
          </div>
          <img src="/lovable-uploads/46b85adb-92bd-446b-80a8-15b57ff39dcf.png" style="width: 10mm; height: 10mm; object-fit: contain;" alt="Logo 2" />
        </div>

        <!-- Main content area -->
        <div style="display: flex; justify-content: space-between; height: calc(100% - 20mm);">
          <!-- User details -->
          <div style="flex: 1; padding-right: 3mm;">
            <div style="margin-bottom: 2mm;">
              <span style="font-size: 9px; font-weight: bold; color: #000;">Name:</span>
              <span style="font-size: 10px; color: #000; margin-left: 2mm; display: block; margin-top: 0.5mm;">${user.name}</span>
            </div>
            <div style="margin-bottom: 2mm;">
              <span style="font-size: 9px; font-weight: bold; color: #000;">NIC:</span>
              <span style="font-size: 10px; color: #000; margin-left: 2mm; display: block; margin-top: 0.5mm;">${user.nic}</span>
            </div>
            <div style="margin-bottom: 2mm;">
              <span style="font-size: 9px; font-weight: bold; color: #000;">Mobile:</span>
              <span style="font-size: 10px; color: #000; margin-left: 2mm; display: block; margin-top: 0.5mm;">${user.mobile}</span>
            </div>
            <div style="margin-bottom: 2mm;">
              <span style="font-size: 9px; font-weight: bold; color: #000;">Address:</span>
              <span style="font-size: 9px; color: #000; margin-left: 2mm; display: block; margin-top: 0.5mm; line-height: 1.2;">${user.address || 'Kalmunai'}</span>
            </div>
          </div>

          <!-- QR Code section -->
          <div style="width: 18mm; height: 18mm; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background: white;">
            ${qrCodeValid 
              ? `<img src="${user.qr_code}" style="width: 16mm; height: 16mm; object-fit: contain; filter: contrast(1.2);" alt="QR Code" />`
              : `<div style="font-size: 8px; color: #ef4444; text-align: center; font-weight: bold;">QR Code<br/>Error</div>`
            }
          </div>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 3mm; left: 4mm; right: 4mm; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #666;">
          <span style="font-weight: bold;">ID: ${user.public_id}</span>
          <span>Generated: ${new Date().toLocaleDateString()}</span>
        </div>
      </div>
    `;

    return cardContent;
  };

  const handlePrint = async () => {
    try {
      const usersToPrint = filteredUsers.filter(user => 
        selectedUsers.includes(user.id)
      );

      if (usersToPrint.length === 0) {
        toast({
          title: "Warning",
          description: "Please select users to print",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const marginX = 10;
      const marginY = 10;
      const spacingX = 5;
      const spacingY = 5;

      const cardsPerRow = 2;
      const cardsPerColumn = 4;
      const cardsPerPage = cardsPerRow * cardsPerColumn;

      let invalidQRCount = 0;
      
      for (let i = 0; i < usersToPrint.length; i++) {
        const user = usersToPrint[i];
        
        if (!validateQRCode(user.qr_code || '')) {
          invalidQRCount++;
        }

        if (i > 0 && i % cardsPerPage === 0) {
          pdf.addPage();
        }

        const cardIndex = i % cardsPerPage;
        const row = Math.floor(cardIndex / cardsPerRow);
        const col = cardIndex % cardsPerRow;

        const x = marginX + col * (CARD_WIDTH + spacingX);
        const y = marginY + row * (CARD_HEIGHT + spacingY);

        const cardContent = createCardContent(user);
        document.body.appendChild(cardContent);
        
        try {
          const canvas = await html2canvas(cardContent, {
            scale: 6,
            logging: false,
            width: CARD_WIDTH * 3.78,
            height: CARD_HEIGHT * 3.78,
            backgroundColor: 'white',
            useCORS: true
          });

          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          pdf.addImage(imgData, 'JPEG', x, y, CARD_WIDTH, CARD_HEIGHT);
        } catch (error) {
          console.error('Error generating card for user:', user.public_id, error);
        } finally {
          document.body.removeChild(cardContent);
        }
      }

      if (autoPrint) {
        // Attempt to auto-print
        try {
          const pdfOutput = pdf.output('blob');
          const url = URL.createObjectURL(pdfOutput);
          const printWindow = window.open(url, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
              URL.revokeObjectURL(url);
            };
          }
        } catch (printError) {
          console.warn('Auto-print failed, falling back to download:', printError);
          pdf.save(`DSK_ID_Cards_${Date.now()}.pdf`);
        }
      } else {
        pdf.save(`DSK_ID_Cards_${Date.now()}.pdf`);
      }

      if (invalidQRCount > 0) {
        toast({
          title: "Warning",
          description: `Generated ${usersToPrint.length} ID card(s) but ${invalidQRCount} user(s) had invalid QR codes.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Generated ${usersToPrint.length} ID card(s) successfully`,
        });
      }
    } catch (error) {
      console.error('Error generating ID cards:', error);
      toast({
        title: "Error",
        description: "Failed to generate ID cards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSinglePrint = async (user: PublicUser) => {
    try {
      setIsLoading(true);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const cardContent = createCardContent(user);
      document.body.appendChild(cardContent);
      
      try {
        const canvas = await html2canvas(cardContent, {
          scale: 6,
          logging: false,
          width: CARD_WIDTH * 3.78,
          height: CARD_HEIGHT * 3.78,
          backgroundColor: 'white',
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        const centerX = (210 - CARD_WIDTH) / 2;
        const centerY = (297 - CARD_HEIGHT) / 2;
        
        pdf.addImage(imgData, 'JPEG', centerX, centerY, CARD_WIDTH, CARD_HEIGHT);
        
        if (autoPrint) {
          try {
            const pdfOutput = pdf.output('blob');
            const url = URL.createObjectURL(pdfOutput);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
              printWindow.onload = () => {
                printWindow.print();
                URL.revokeObjectURL(url);
              };
            }
          } catch (printError) {
            console.warn('Auto-print failed, falling back to download:', printError);
            pdf.save(`DSK_ID_Card_${user.public_id}.pdf`);
          }
        } else {
          pdf.save(`DSK_ID_Card_${user.public_id}.pdf`);
        }

        toast({
          title: "Success",
          description: `ID card for ${user.name} generated successfully`,
        });
      } finally {
        document.body.removeChild(cardContent);
      }
    } catch (error) {
      console.error('Error generating single ID card:', error);
      toast({
        title: "Error",
        description: "Failed to generate ID card",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>ID Card Generator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate and print professional ID cards with enhanced visibility
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-print" 
                  checked={autoPrint} 
                  onCheckedChange={setAutoPrint}
                />
                <label htmlFor="auto-print" className="text-sm font-medium">
                  Auto Print
                </label>
              </div>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={isLoading || filteredUsers.length === 0}
              >
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="default"
                onClick={handlePrint}
                disabled={isLoading || selectedUsers.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Printer className="mr-2 h-4 w-4" />
                {autoPrint ? 'Print' : 'Generate'} ({selectedUsers.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="search-users"
                name="search-users"
                placeholder="Search by ID, name or NIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map(user => (
                  <Card key={user.id} className="relative">
                    <CardContent className="p-4">
                      <div className="absolute top-4 right-4">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </div>
                      <div className="pr-8 space-y-2">
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.public_id}</p>
                        <p className="text-sm text-muted-foreground">{user.nic}</p>
                        {!validateQRCode(user.qr_code || '') && (
                          <div className="flex items-center text-amber-600">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            <span className="text-xs">QR Code Issue</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSinglePrint(user)}
                          className="w-full mt-2"
                          disabled={isLoading}
                        >
                          {autoPrint ? <Printer className="mr-2 h-3 w-3" /> : <Download className="mr-2 h-3 w-3" />}
                          {autoPrint ? 'Print' : 'Generate'} Single
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">💡 Enhanced Features:</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Larger fonts for better readability in print</li>
                <li>• Enhanced QR code contrast for black & white printers</li>
                <li>• Auto-print option for direct printer output</li>
                <li>• A4 format: 8 cards per page (2x4 layout)</li>
                <li>• International standard card size: 85.6mm x 54mm</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDCardGenerator;
