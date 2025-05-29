import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import type { PublicUser } from '@/services/api';
import { Search, Printer, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Standard ID card dimensions (85.6mm x 54mm)
const CARD_WIDTH = 85.6;
const CARD_HEIGHT = 54;

const IDCardGenerator = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PublicUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      <div style="width: ${CARD_WIDTH}mm; height: ${CARD_HEIGHT}mm; padding: 3mm; font-family: Arial, sans-serif; border: 2px solid #000; border-radius: 3mm; background: white; position: relative; box-sizing: border-box;">
        <!-- Header with logos and title -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; border-bottom: 1px solid #333;">
          <img src="/lovable-uploads/e73a2c54-9e18-43f7-baf6-bfb62be56894.png" style="width: 8mm; height: 8mm; object-fit: contain;" alt="Logo 1" />
          <div style="text-align: center; flex: 1; padding: 0 2mm;">
            <h2 style="margin: 0; font-size: 9px; font-weight: bold; color: #000; line-height: 1.1;">Divisional Secretariat</h2>
            <h3 style="margin: 0; font-size: 8px; font-weight: bold; color: #000;">Kalmunai</h3>
          </div>
          <img src="/lovable-uploads/46b85adb-92bd-446b-80a8-15b57ff39dcf.png" style="width: 8mm; height: 8mm; object-fit: contain;" alt="Logo 2" />
        </div>

        <!-- Main content area -->
        <div style="display: flex; justify-content: space-between; height: calc(100% - 15mm);">
          <!-- User details -->
          <div style="flex: 1; padding-right: 2mm;">
            <div style="margin-bottom: 1.5mm;">
              <span style="font-size: 7px; font-weight: bold; color: #000;">Name:</span>
              <span style="font-size: 8px; color: #000; margin-left: 2mm;">${user.name}</span>
            </div>
            <div style="margin-bottom: 1.5mm;">
              <span style="font-size: 7px; font-weight: bold; color: #000;">NIC:</span>
              <span style="font-size: 8px; color: #000; margin-left: 2mm;">${user.nic}</span>
            </div>
            <div style="margin-bottom: 1.5mm;">
              <span style="font-size: 7px; font-weight: bold; color: #000;">Mobile:</span>
              <span style="font-size: 8px; color: #000; margin-left: 2mm;">${user.mobile}</span>
            </div>
            <div style="margin-bottom: 1.5mm;">
              <span style="font-size: 7px; font-weight: bold; color: #000;">Address:</span>
              <span style="font-size: 8px; color: #000; margin-left: 2mm;">${user.address || 'Kalmunai'}</span>
            </div>
          </div>

          <!-- QR Code section -->
          <div style="width: 15mm; height: 15mm; border: 1px solid #333; display: flex; align-items: center; justify-content: center;">
            ${qrCodeValid 
              ? `<img src="${user.qr_code}" style="width: 13mm; height: 13mm; object-fit: contain;" alt="QR Code" />`
              : `<div style="font-size: 6px; color: #ef4444; text-align: center;">Invalid QR</div>`
            }
          </div>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 2mm; left: 3mm; right: 3mm; display: flex; justify-content: space-between; align-items: center; font-size: 6px; color: #666;">
          <span>ID: ${user.public_id}</span>
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

      // Create PDF with A4 size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions: 210mm x 297mm
      // Margins
      const marginX = 10;
      const marginY = 10;
      const spacingX = 5;
      const spacingY = 5;

      // Calculate cards per page (2 columns x 4 rows = 8 cards per page)
      const cardsPerRow = 2;
      const cardsPerColumn = 4;
      const cardsPerPage = cardsPerRow * cardsPerColumn;

      let invalidQRCount = 0;
      
      for (let i = 0; i < usersToPrint.length; i++) {
        const user = usersToPrint[i];
        
        if (!validateQRCode(user.qr_code || '')) {
          invalidQRCount++;
        }

        // Add new page if needed
        if (i > 0 && i % cardsPerPage === 0) {
          pdf.addPage();
        }

        const cardIndex = i % cardsPerPage;
        const row = Math.floor(cardIndex / cardsPerRow);
        const col = cardIndex % cardsPerRow;

        const x = marginX + col * (CARD_WIDTH + spacingX);
        const y = marginY + row * (CARD_HEIGHT + spacingY);

        // Create and render card
        const cardContent = createCardContent(user);
        document.body.appendChild(cardContent);
        
        try {
          const canvas = await html2canvas(cardContent, {
            scale: 4,
            logging: false,
            width: CARD_WIDTH * 3.78,
            height: CARD_HEIGHT * 3.78,
            backgroundColor: 'white'
          });

          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          pdf.addImage(imgData, 'JPEG', x, y, CARD_WIDTH, CARD_HEIGHT);
        } catch (error) {
          console.error('Error generating card for user:', user.public_id, error);
        } finally {
          document.body.removeChild(cardContent);
        }
      }

      pdf.save(`DSK_ID_Cards_${Date.now()}.pdf`);

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
          scale: 4,
          logging: false,
          width: CARD_WIDTH * 3.78,
          height: CARD_HEIGHT * 3.78,
          backgroundColor: 'white'
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // Center the card on A4 page
        const centerX = (210 - CARD_WIDTH) / 2;
        const centerY = (297 - CARD_HEIGHT) / 2;
        
        pdf.addImage(imgData, 'JPEG', centerX, centerY, CARD_WIDTH, CARD_HEIGHT);
        pdf.save(`DSK_ID_Card_${user.public_id}.pdf`);

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
                Generate and print professional ID cards for public users
              </p>
            </div>
            <div className="flex space-x-4">
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
                Bulk Print ({selectedUsers.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSinglePrint(user)}
                          className="w-full mt-2"
                          disabled={isLoading}
                        >
                          <Printer className="mr-2 h-3 w-3" />
                          Print Single
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDCardGenerator;
