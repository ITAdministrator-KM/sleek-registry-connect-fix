import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import type { PublicUser } from '@/services/apiService';
import { Search, Printer, AlertCircle, Download } from 'lucide-react';
import { StandardBlackWhiteIDCard } from './id-card/StandardBlackWhiteIDCard';

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

  const handlePrintSingle = (user: PublicUser) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check popup settings.",
        variant: "destructive",
      });
      return;
    }

    const cardHTML = generateSingleCardHTML(user);
    printWindow.document.write(cardHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        if (autoPrint) {
          printWindow.print();
          printWindow.onafterprint = () => {
            setTimeout(() => printWindow.close(), 1000);
          };
        }
      }, 1000);
    };
  };

  const generateSingleCardHTML = (user: PublicUser) => {
    const qrData = JSON.stringify({
      public_id: user.public_id,
      name: user.name,
      nic: user.nic,
      mobile: user.mobile,
      address: user.address,
      issued: new Date().toISOString().split('T')[0],
      authority: 'Divisional Secretariat Kalmunai'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ID Card - ${user.name}</title>
        <style>
          @page { 
            size: 85.6mm 54mm;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body { 
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .id-card {
            width: 85.6mm;
            height: 54mm;
            border: 4px solid #000;
            background: white;
            color: black;
            font-size: 10px;
            line-height: 1.2;
            font-weight: bold;
            padding: 3mm;
            box-sizing: border-box;
            position: relative;
          }
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2mm;
            border-bottom: 2px solid black;
            padding-bottom: 2mm;
          }
          .logo {
            width: 12mm;
            height: 12mm;
            border: 2px solid black;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          .logo img {
            width: 10mm;
            height: 10mm;
            object-fit: contain;
            filter: contrast(1) brightness(0);
          }
          .title {
            text-align: center;
            flex: 1;
            margin: 0 2mm;
          }
          .title-main {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .title-sub {
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 1mm;
          }
          .card-body {
            display: flex;
            height: calc(100% - 20mm);
          }
          .user-info {
            width: 50%;
            padding-right: 2mm;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
          }
          .info-item {
            margin-bottom: 1.5mm;
          }
          .info-label {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 0.5mm;
          }
          .info-value {
            font-size: 9px;
            font-weight: bold;
            line-height: 1.1;
          }
          .qr-section {
            width: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-left: 2px solid black;
            padding-left: 2mm;
          }
          .qr-container {
            background: white;
            padding: 2mm;
            border: 2px solid black;
          }
          .qr-label {
            font-size: 7px;
            text-align: center;
            margin-top: 2mm;
            font-weight: bold;
            text-transform: uppercase;
          }
          .card-footer {
            position: absolute;
            bottom: 2mm;
            left: 3mm;
            right: 3mm;
            padding-top: 1mm;
            border-top: 1px solid black;
            display: flex;
            justify-content: space-between;
            font-size: 7px;
            font-weight: bold;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      </head>
      <body>
        <div class="id-card">
          <div class="card-header">
            <div class="logo">
              <img src="/emblem.svg" alt="Government Emblem" />
            </div>
            <div class="title">
              <div class="title-main">DIVISIONAL SECRETARIAT</div>
              <div class="title-sub">KALMUNAI</div>
            </div>
            <div class="logo">
              <img src="/logo.svg" alt="DS Logo" />
            </div>
          </div>
          
          <div class="card-body">
            <div class="user-info">
              <div class="info-item">
                <div class="info-label">Name:</div>
                <div class="info-value">${user.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">NIC:</div>
                <div class="info-value">${user.nic}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date of Birth:</div>
                <div class="info-value">${user.date_of_birth || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Mobile Number:</div>
                <div class="info-value">${user.mobile}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Address:</div>
                <div class="info-value">${user.address.length > 30 ? user.address.substring(0, 30) + '...' : user.address}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Public ID:</div>
                <div class="info-value">${user.public_id}</div>
              </div>
            </div>
            
            <div class="qr-section">
              <div class="qr-container">
                <canvas id="qr-canvas" width="70" height="70"></canvas>
              </div>
              <div class="qr-label">SCAN TO VERIFY</div>
            </div>
          </div>
          
          <div class="card-footer">
            <span>Issued: ${new Date().toLocaleDateString()}</span>
            <span>OFFICIAL DOCUMENT</span>
          </div>
        </div>
        
        <script>
          QRCode.toCanvas(document.getElementById('qr-canvas'), '${qrData}', {
            width: 70,
            height: 70,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
          });
        </script>
      </body>
      </html>
    `;
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

  const handleAutoPrintChange = (checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') {
      setAutoPrint(checked);
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
                Generate black & white government ID cards with official format
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-print" 
                  checked={autoPrint}
                  onCheckedChange={handleAutoPrintChange}
                />
                <label htmlFor="auto-print" className="text-sm">Auto Print</label>
              </div>
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
                            onClick={() => handlePrintSingle(user)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-gray-600">ID: {user.public_id}</p>
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
              <h4 className="text-sm font-medium text-blue-700 mb-2">🖨️ Black & White ID Card Features:</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• ⚫ High contrast black and white design</li>
                <li>• 🏛️ Official government format with dual logos</li>
                <li>• 📏 Wallet size: 85.6mm x 54mm</li>
                <li>• 🔍 Large QR code for easy scanning</li>
                <li>• 🖨️ Optimized for monochrome printing</li>
                <li>• 📄 Professional typography and layout</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDCardGenerator;
