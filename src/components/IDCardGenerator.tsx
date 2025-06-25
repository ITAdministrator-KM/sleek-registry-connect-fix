
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import type { PublicUser } from '@/services/apiService';
import { Search, Printer, AlertCircle, Download } from 'lucide-react';
import IDCardUserList from './id-card/IDCardUserList';

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

    const cardHTML = generateProfessionalCardHTML(user);
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

  const generateProfessionalCardHTML = (user: PublicUser) => {
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
        <title>Official ID Card - ${user.name}</title>
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
            font-family: 'Arial', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
          }
          .id-card {
            width: 85.6mm;
            height: 54mm;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            color: #212529;
            font-size: 8px;
            line-height: 1.3;
            padding: 3mm;
            box-sizing: border-box;
            position: relative;
            border: 1px solid #dee2e6;
            border-radius: 3mm;
          }
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2mm;
            padding-bottom: 1.5mm;
            border-bottom: 1px solid #6c757d;
          }
          .logo {
            width: 10mm;
            height: 10mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: contrast(1.2) brightness(0.8);
          }
          .header-title {
            text-align: center;
            flex: 1;
            margin: 0 2mm;
          }
          .title-main {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #495057;
            margin-bottom: 0.5mm;
          }
          .title-sub {
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.8px;
            color: #212529;
          }
          .card-content {
            display: flex;
            height: calc(100% - 16mm);
            gap: 2mm;
          }
          .user-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .detail-group {
            margin-bottom: 1mm;
          }
          .detail-label {
            font-size: 6px;
            font-weight: bold;
            color: #6c757d;
            text-transform: uppercase;
            margin-bottom: 0.3mm;
            letter-spacing: 0.2px;
          }
          .detail-value {
            font-size: 8px;
            font-weight: 600;
            color: #212529;
            line-height: 1.1;
            word-wrap: break-word;
          }
          .qr-section {
            width: 20mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            border-radius: 1mm;
            padding: 1mm;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          .qr-container {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .qr-label {
            font-size: 5px;
            text-align: center;
            margin-top: 1mm;
            font-weight: bold;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          .card-footer {
            position: absolute;
            bottom: 1.5mm;
            left: 3mm;
            right: 3mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 5px;
            font-weight: bold;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 1mm;
          }
          .official-seal {
            font-size: 6px;
            color: #dc3545;
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
            <div class="header-title">
              <div class="title-main">Divisional Secretariat</div>
              <div class="title-sub">KALMUNAI</div>
            </div>
            <div class="logo">
              <img src="/logo.svg" alt="DS Logo" />
            </div>
          </div>
          
          <div class="card-content">
            <div class="user-details">
              <div class="detail-group">
                <div class="detail-label">Full Name</div>
                <div class="detail-value">${user.name}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">NIC Number</div>
                <div class="detail-value">${user.nic}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Date of Birth</div>
                <div class="detail-value">${user.date_of_birth || 'N/A'}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Mobile Number</div>
                <div class="detail-value">${user.mobile}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Address</div>
                <div class="detail-value">${user.address.length > 35 ? user.address.substring(0, 35) + '...' : user.address}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Public ID</div>
                <div class="detail-value">${user.public_id}</div>
              </div>
            </div>
            
            <div class="qr-section">
              <div class="qr-container">
                <canvas id="qr-canvas" width="60" height="60"></canvas>
              </div>
              <div class="qr-label">Scan to Verify</div>
            </div>
          </div>
          
          <div class="card-footer">
            <span>Issued: ${new Date().toLocaleDateString()}</span>
            <span class="official-seal">OFFICIAL DOCUMENT</span>
          </div>
        </div>
        
        <script>
          QRCode.toCanvas(document.getElementById('qr-canvas'), '${qrData}', {
            width: 60,
            height: 60,
            color: {
              dark: '#212529',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H',
            margin: 1
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
              <CardTitle className="flex items-center gap-2">
                📇 Professional ID Card Generator
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate official government ID cards with international standards
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-print" 
                  checked={autoPrint}
                  onCheckedChange={(checked) => typeof checked === 'boolean' && setAutoPrint(checked)}
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
                
                <IDCardUserList
                  users={filteredUsers}
                  selectedUsers={selectedUsers}
                  onUserSelect={handleSelectUser}
                  onPrintSingle={handlePrintSingle}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDCardGenerator;
