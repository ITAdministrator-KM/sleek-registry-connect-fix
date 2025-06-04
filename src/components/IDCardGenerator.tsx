
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import type { PublicUser } from '@/services/api';
import { Search, Printer, AlertCircle, Download } from 'lucide-react';
import { UserSelectionControls } from './id-card/UserSelectionControls';
import { UserCardList } from './id-card/UserCardList';
import { ResponsiveIDCardPrinter } from './id-card/ResponsiveIDCardPrinter';

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
      await ResponsiveIDCardPrinter.printMultipleCards(usersToPrint, autoPrint, toast);
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
      await ResponsiveIDCardPrinter.printSingleCard(user, autoPrint, toast);
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
              <CardTitle>📇 ID Card Generator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate and print professional ID cards with sequential numbering
              </p>
            </div>
            <UserSelectionControls
              autoPrint={autoPrint}
              setAutoPrint={setAutoPrint}
              selectedCount={selectedUsers.length}
              filteredCount={filteredUsers.length}
              isLoading={isLoading}
              onSelectAll={handleSelectAll}
              onPrint={handlePrint}
            />
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
              <UserCardList
                users={filteredUsers}
                selectedUsers={selectedUsers}
                onSelectUser={handleSelectUser}
                onSinglePrint={handleSinglePrint}
                isLoading={isLoading}
                autoPrint={autoPrint}
              />
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">💡 Enhanced Features:</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• ✅ Sequential ID numbering: PUB00001, PUB00002, etc.</li>
                <li>• 📐 Optimized layout for long addresses (auto-truncation)</li>
                <li>• 🖨️ Enhanced print quality for black & white printers</li>
                <li>• 📱 Responsive design for all devices</li>
                <li>• 📄 A4 format: 2 cards per page (optimized layout)</li>
                <li>• 🎯 International standard card size: 85.6mm x 54mm</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDCardGenerator;
