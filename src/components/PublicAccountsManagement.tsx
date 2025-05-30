
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import type { PublicUser } from '@/services/api';
import { Search, UserPlus } from 'lucide-react';
import { PublicUserForm } from './public-accounts/PublicUserForm';
import { PublicUserTable } from './public-accounts/PublicUserTable';
import { ConfirmDialog } from './public-accounts/ConfirmDialog';

const PublicAccountsManagement = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PublicUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    const filtered = safeUsers.filter(user => 
      user.public_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getPublicUsers();
      const safeResponse = Array.isArray(response) ? response : [];
      setUsers(safeResponse);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      toast({
        title: "Error",
        description: "Failed to fetch public users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      setIsLoading(true);
      const newUser = await apiService.createPublicUser(userData);
      setUsers(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [newUser, ...safePrev];
      });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Public user created successfully with sequential ID",
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create public user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userData: any) => {
    try {
      setIsLoading(true);
      const updatedUser = await apiService.updatePublicUser(userData.id, userData);
      setUsers(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        );
      });
      setEditingUser(null);
      toast({
        title: "Success",
        description: "Public user updated successfully",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update public user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setIsLoading(true);
      await apiService.deletePublicUser(deletingUser.id);
      setUsers(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.filter(user => user.id !== deletingUser.id);
      });
      setDeletingUser(null);
      toast({
        title: "Success",
        description: "Public user deleted successfully from database",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete public user from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: PublicUser) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = (user: PublicUser) => {
    setDeletingUser(user);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const safeUsers = Array.isArray(users) ? users : [];
  const safeFilteredUsers = Array.isArray(filteredUsers) ? filteredUsers : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Public Accounts Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total accounts: {safeUsers.length} | Sequential ID assignment from PUB00001
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="search-public-accounts"
                name="search-public-accounts"
                placeholder="Search accounts by ID, name, NIC, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">Loading accounts...</div>
            ) : (
              <PublicUserTable
                users={safeFilteredUsers}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <PublicUserForm
          user={editingUser}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          onClose={closeForm}
          isLoading={isLoading}
        />
      )}

      {deletingUser && (
        <ConfirmDialog
          title="Delete Public Account"
          message={`Are you sure you want to delete the account for ${deletingUser.name}? This will permanently remove the record from the database and cannot be undone.`}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeletingUser(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default PublicAccountsManagement;
