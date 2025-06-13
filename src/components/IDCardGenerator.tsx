import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import type { PublicUser } from '@/services/api';
import { Search, Printer, AlertCircle, Download } from 'lucide-react';
import StandardIDCard from './id-card/StandardIDCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
      // Sort by public_id to ensure proper order (PUB00001, PUB00002, etc.)
      const sortedUsers = response.sort((a, b) => {
        const aNum = parseInt(a.public_id.replace('PUB', ''));
        const bNum = parseInt(b.public_id.replace('PUB', ''));
        return aNum - bNum;
      });
      setUsers(sortedUsers);
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

  const generatePDF = async (usersToPrint: PublicUser[]) => {
    try {
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const cardWidth = 85.6;
      const cardHeight = 54;
      const margin = 10;
      
      // Two cards per page layout
      const cardsPerPage = 2;
      let currentPage = 0;
      
      for (let i = 0; i < usersToPrint.length; i++) {
        const user = usersToPrint[i];
        const cardIndex = i % cardsPerPage;
        
        if (cardIndex === 0 && i > 0) {
          pdf.addPage();
          currentPage++;
        }
        
        // Create a temporary div for the ID card
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        document.body.appendChild(tempDiv);
        
        // Render the ID card component
        const cardElement = document.createElement('div');
        cardElement.innerHTML = `
          <div style="width: 85.6mm; height: 54mm; background: white; border: 2px solid black; font-family: Arial; font-size: 8px; color: black; padding: 3mm; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; border-bottom: 1px solid black; padding-bottom: 1mm;">
              <div style="width: 12mm; height: 12mm; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-size: 6px;">LOGO1</div>
              <div style="text-align: center; font-weight: bold; font-size: 9px; flex: 1; margin: 0 2mm;">
                <div>DIVISIONAL SECRETARIAT</div>
                <div>KALMUNAI</div>
              </div>
              <div style="width: 12mm; height: 12mm; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-size: 6px;">LOGO2</div>
            </div>
            <div style="display: flex; height: calc(100% - 15mm);">
              <div style="flex: 1; padding-right: 2mm;">
                <div style="margin-bottom: 1.5mm; display: flex; font-size: 7px;">
                  <span style="font-weight: bold; width: 25mm;">Name:</span>
                  <span>${user.name}</span>
                </div>
                <div style="margin-bottom: 1.5mm; display: flex; font-size: 7px;">
                  <span style="font-weight: bold; width: 25mm;">NIC:</span>
                  <span>${user.nic}</span>
                </div>
                <div style="margin-bottom: 1.5mm; display: flex; font-size: 7px;">
                  <span style="font-weight: bold; width: 25mm;">Mobile:</span>
                  <span>${user.mobile || 'N/A'}</span>
                </div>
                <div style="margin-bottom: 1.5mm; display: flex; font-size: 7px;">
                  <span style="font-weight: bold; width: 25mm;">Address:</span>
                  <span>${user.address.length > 45 ? user.address.substring(0, 45) + '...' : user.address}</span>
                </div>
                <div style="margin-bottom: 1.5mm; display: flex; font-size: 7px;">
                  <span style="font-weight: bold; width: 25mm;">Public ID:</span>
                  <span>${user.public_user_id}</span>
                </div>
              </div>
              <div style="width: 50%; display: flex; align-items: center; justify-content: center;">
                <div style="width: 35mm; height: 35mm; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-size: 10px;">QR CODE</div>
              </div>
            </div>
          </div>
        `;
        
        tempDiv.appendChild(cardElement);
        
        // Convert to canvas and add to PDF
        const canvas = await html2canvas(cardElement, {
          scale: 3,
          backgroundColor: 'white',
          width: 324, // 85.6mm at 96 DPI
          height: 204  // 54mm at 96 DPI
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Position calculation
        const x = margin + (cardIndex === 1 ? cardWidth + 20 : 0);
        const y = margin + Math.floor(i / 2) * (cardHeight + 20);
        
        pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
        
        // Clean up
        document.body.removeChild(tempDiv);
      }
      
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
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
      const pdf = await generatePDF(usersToPrint);
      
      if (autoPrint) {
        pdf.autoPrint();
      }
      
      pdf.save(`id-cards-batch-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Success",
        description: `Generated ID cards for ${usersToPrint.length} users`,
      });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>📇 ID Card Generator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate and print professional ID cards with sequential numbering
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-print" 
                  checked={autoPrint}
                  onCheckedChange={setAutoPrint}
                />
                <label htmlFor="auto-print" className="text-sm">Auto Print</label>
              </div>
              <Button
                onClick={handlePrint}
                disabled={isLoading || selectedUsers.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
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
            
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedUsers.length === filteredUsers.length) {
                        setSelectedUsers([]);
                      } else {
                        setSelectedUsers(filteredUsers.map(user => user.id));
                      }
                    }}
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <p className="text-sm text-gray-600">
                    {selectedUsers.length} of {filteredUsers.length} selected
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => {
                              setSelectedUsers(prev => 
                                prev.includes(user.id)
                                  ? prev.filter(id => id !== user.id)
                                  : [...prev, user.id]
                              );
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrint()}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-gray-600">ID: {user.public_user_id}</p>
                          <p className="text-gray-600">NIC: {user.nic}</p>
                          <p className="text-gray-500 text-xs">{user.mobile}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">💡 Enhanced Features:</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• ✅ Sequential ID numbering: PUB00001, PUB00002, etc.</li>
                <li>• 📐 Government standard format with dual logos</li>
                <li>• 🖨️ Optimized for black & white printing</li>
                <li>• 📱 Responsive design for all devices</li>
                <li>• 📄 A4 format: 2 cards per page (wallet size)</li>
                <li>• 🎯 Standard card size: 85.6mm x 54mm</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDCardGenerator;
