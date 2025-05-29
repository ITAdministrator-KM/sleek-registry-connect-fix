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

// Card dimensions (85.6mm x 54mm - standard credit card size)
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
    // Check if it's a valid base64 data URL
    return qrCode.startsWith('data:image/png;base64,') || 
           qrCode.startsWith('data:image/jpeg;base64,');
  };

  const createCardContent = (user: PublicUser): HTMLDivElement => {
    const cardContent = document.createElement('div');
    
    // Validate QR code before using it
    const qrCodeValid = validateQRCode(user.qr_code);
    
    cardContent.innerHTML = `
      <div style="width: ${CARD_WIDTH}mm; height: ${CARD_HEIGHT}mm; padding: 3mm; font-family: Arial; border: 1px solid #ccc; border-radius: 2mm;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h2 style="margin: 0; font-size: 12px; color: #1e40af;">DSK Services Portal</h2>
            <p style="margin: 1mm 0; font-size: 10px;">Kalmunai</p>
          </div>
          ${qrCodeValid 
            ? `<img src="${user.qr_code}" style="width: 15mm; height: 15mm; object-fit: contain;" alt="QR Code" />`
            : `<div style="width: 15mm; height: 15mm; display: flex; align-items: center; justify-content: center; background: #f3f4f6;">
                <span style="font-size: 8px; color: #ef4444; text-align: center;">Invalid QR</span>
               </div>`
          }
        </div>
        <div style="margin-top: 2mm;">
          <p style="margin: 1mm 0; font-size: 9px;"><strong>ID:</strong> ${user.public_id}</p>
          <p style="margin: 1mm 0; font-size: 9px;"><strong>Name:</strong> ${user.name}</p>
          <p style="margin: 1mm 0; font-size: 9px;"><strong>NIC:</strong> ${user.nic}</p>
          <p style="margin: 1mm 0; font-size: 8px;"><strong>Address:</strong> ${user.address || 'N/A'}</p>
          <p style="margin: 1mm 0; font-size: 9px;"><strong>Mobile:</strong> ${user.mobile || 'N/A'}</p>
        </div>
        <div style="position: absolute; bottom: 2mm; left: 3mm; right: 3mm; display: flex; justify-content: space-between; align-items: center;">
          <p style="margin: 0; font-size: 7px; color: #666;">Generated: ${new Date().toLocaleDateString()}</p>
          <p style="margin: 0; font-size: 7px; color: #666;">DSK Services</p>
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

      // Margins and spacing
      const marginX = 10;
      const marginY = 10;
      const spacingX = 5;
      const spacingY = 5;

      // Calculate cards per row and column
      const cardsPerRow = 2;
      const cardsPerColumn = 5;

      let invalidQRCount = 0;
      
      for (let i = 0; i < usersToPrint.length; i++) {
        const user = usersToPrint[i];
        
        if (!validateQRCode(user.qr_code)) {
          invalidQRCount++;
        }

        if (i > 0 && i % (cardsPerRow * cardsPerColumn) === 0) {
          pdf.addPage();
        }

        const cardIndex = i % (cardsPerRow * cardsPerColumn);
        const row = Math.floor(cardIndex / cardsPerRow);
        const col = cardIndex % cardsPerRow;

        const x = marginX + col * (CARD_WIDTH + spacingX);
        const y = marginY + row * (CARD_HEIGHT + spacingY);

        // Create and append card content
        const cardContent = createCardContent(user);
        document.body.appendChild(cardContent);
        
        try {
          const canvas = await html2canvas(cardContent, {
            scale: 4,
            logging: false,
            width: CARD_WIDTH * 3.78, // Convert mm to pixels (96 DPI)
            height: CARD_HEIGHT * 3.78,
            backgroundColor: null
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
          description: `Generated ID cards but ${invalidQRCount} user(s) had invalid QR codes. These will be marked on the cards.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Generated ${usersToPrint.length} ID card(s)`,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>ID Card Generator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate and print ID cards for public users
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
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Selected ({selectedUsers.length})
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
                    <div className="pr-8">
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.public_id}</p>
                      <p className="text-sm text-muted-foreground">{user.nic}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDCardGenerator;
