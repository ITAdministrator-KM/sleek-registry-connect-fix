import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, Eye, User } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiService, User } from '@/services/apiService';
import UserForm from './forms/UserForm';

type UserRole = 'admin' | 'staff' | 'public';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.user_id && user.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUsers();
      console.log('Fetched users:', response);
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

  const handleSubmit = async (formData: {
    name: string;
    nic: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    department_id: number | null;
    division_id: number | null;
  }) => {
    try {
      setIsDialogOpen(false);
      
      if (editingUser) {
        await apiService.updateUser(editingUser.id, formData);
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        await apiService.createUser(formData);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      
      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save user",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleView = (user: User) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await apiService.deleteUser(id);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border border-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'public': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setEditingUser(null)}
            >
              <Plus className="mr-2" size={20} />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user information and permissions' : 'Create a new user account with appropriate permissions'}
              </DialogDescription>
            </DialogHeader>
            
            <UserForm
              user={editingUser}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users Overview</CardTitle>
              <CardDescription>
                Total users: {users.length} | Filtered: {filteredUsers.length}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{user.user_id || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{user.department_name || 'N/A'}</div>
                          {user.division_name && (
                            <div className="text-gray-500 text-xs">{user.division_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(user)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewingUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {viewingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{viewingUser.user_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      viewingUser.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingUser.status}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-sm">{viewingUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <p className="text-sm">{viewingUser.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm">{viewingUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NIC</label>
                  <p className="text-sm">{viewingUser.nic}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(viewingUser.role)}`}>
                      {viewingUser.role.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">{new Date(viewingUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-sm">{viewingUser.department_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Division</label>
                  <p className="text-sm">{viewingUser.division_name || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (viewingUser) handleEdit(viewingUser);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="mr-2" size={16} />
              Edit User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
