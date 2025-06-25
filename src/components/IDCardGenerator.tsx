
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import type { PublicUser } from '@/services/apiService';
import { Search, Printer, Download, CreditCard } from 'lucide-react';
import IDCardUserList from './id-card/IDCardUserList';
import { ProfessionalIDCardPrinter } from './id-card/ProfessionalIDCardPrinter';

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

  const handlePrintSingle = async (user: PublicUser) => {
    await ProfessionalIDCardPrinter.printSingleCard(user, autoPrint, toast);
  };

  const handlePrintSelected = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select users to print ID cards",
        variant: "destructive",
      });
      return;
    }

    const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));
    await ProfessionalIDCardPrinter.printMultipleCards(selectedUserObjects, autoPrint, toast);
  };

  const handlePrintAll = async () => {
    if (filteredUsers.length === 0) {
      toast({
        title: "No Users",
        description: "No users available to print",
        variant: "destructive",
      });
      return;
    }

    await ProfessionalIDCardPrinter.printMultipleCards(filteredUsers, autoPrint, toast);
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
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Professional ID Card Generator
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate official government ID cards with international standards (85.6mm × 54mm)
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
                id="search-cards"
                name="search"
                autoComplete="off"
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSelectAll}
                    >
                      {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      onClick={handlePrintSelected}
                      disabled={selectedUsers.length === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Selected ({selectedUsers.length})
                    </Button>
                    <Button
                      onClick={handlePrintAll}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Print All ({filteredUsers.length})
                    </Button>
                  </div>
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
