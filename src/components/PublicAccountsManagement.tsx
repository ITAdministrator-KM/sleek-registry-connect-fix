import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiService, PublicUser } from '@/services/apiService';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PublicUserIDCard from './PublicUserIDCard';

export const PublicAccountsManagement: React.FC = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    email: '',
    mobile: '',
    address: '',
    date_of_birth: '',
    status: 'active' as 'active' | 'inactive'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const userData = await apiService.getPublicUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching public users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch public users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await apiService.createPublicUser(formData);
      toast({
        title: "Success",
        description: "Public user created successfully",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        nic: '',
        email: '',
        mobile: '',
        address: '',
        date_of_birth: '',
        status: 'active'
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create public user",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: PublicUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      nic: user.nic || '',
      email: user.email || '',
      mobile: user.mobile || '',
      address: user.address || '',
      date_of_birth: user.date_of_birth || '',
      status: user.status || 'active'
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    
    try {
      await apiService.updatePublicUser(selectedUser.id, formData);
      toast({
        title: "Success",
        description: "Public user updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update public user",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (user: PublicUser) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await apiService.deletePublicUser(user.id);
        toast({
          title: "Success",
          description: "Public user deleted successfully",
        });
        fetchUsers();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete public user",
          variant: "destructive",
        });
      }
    }
  };

  const handleView = (user: PublicUser) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading public accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Public Accounts Management</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Public Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nic">NIC</Label>
                    <Input
                      id="nic"
                      value={formData.nic}
                      onChange={(e) => setFormData({...formData, nic: e.target.value})}
                      placeholder="Enter NIC number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Enter address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search by name, ID, or NIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">ID: {user.public_id}</p>
                    <p className="text-sm text-gray-600">NIC: {user.nic}</p>
                    <p className="text-sm text-gray-600">Mobile: {user.mobile}</p>
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => handleView(user)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(user)}>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No public accounts found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Public Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-nic">NIC</Label>
              <Input
                id="edit-nic"
                value={formData.nic}
                onChange={(e) => setFormData({...formData, nic: e.target.value})}
                placeholder="Enter NIC number"
              />
            </div>
            <div>
              <Label htmlFor="edit-mobile">Mobile</Label>
              <Input
                id="edit-mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                placeholder="Enter mobile number"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email (Optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Enter address"
              />
            </div>
            <div>
              <Label htmlFor="edit-date_of_birth">Date of Birth</Label>
              <Input
                id="edit-date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog with ID Card */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>View Public Account & ID Card</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <PublicUserIDCard 
              user={selectedUser} 
              showActions={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicAccountsManagement;
