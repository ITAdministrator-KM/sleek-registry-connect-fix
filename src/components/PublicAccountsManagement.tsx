
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiService, PublicUser, Department, Division } from '@/services/apiService';
import { Search, Plus, Edit, Trash2, User, AlertTriangle, IdCard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const PublicAccountsManagement: React.FC = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    address: '',
    mobile: '',
    email: '',
    username: '',
    password: '',
    department_id: '',
    division_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetchUsers(),
      fetchDepartments(),
      fetchDivisions()
    ]);
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const userData = await apiService.getPublicUsers();
      setUsers(Array.isArray(userData) ? userData : []);
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

  const fetchDepartments = async () => {
    try {
      const departmentsData = await apiService.getDepartments();
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const divisionsData = await apiService.getDivisions();
      setDivisions(Array.isArray(divisionsData) ? divisionsData : []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData = {
        name: formData.name,
        nic: formData.nic,
        address: formData.address,
        mobile: formData.mobile,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        division_id: formData.division_id ? parseInt(formData.division_id) : undefined,
        status: 'active' as const,
      };

      if (editingUser) {
        const updateData = { ...userData };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        await apiService.updatePublicUser(editingUser.id, updateData);
        toast({
          title: "Success",
          description: "Public user updated successfully",
        });
      } else {
        await apiService.createPublicUser(userData);
        toast({
          title: "Success",
          description: "Public user created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving public user:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingUser ? 'update' : 'create'} public user`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: PublicUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      nic: user.nic,
      address: user.address,
      mobile: user.mobile,
      email: user.email || '',
      username: user.username || '',
      password: '',
      department_id: user.department_id?.toString() || '',
      division_id: user.division_id?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (user: PublicUser) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await apiService.deletePublicUser(deletingUser.id);
      toast({
        title: "Success",
        description: `Public user ${deletingUser.name} deleted successfully`,
      });
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting public user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete public user",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nic: '',
      address: '',
      mobile: '',
      email: '',
      username: '',
      password: '',
      department_id: '',
      division_id: ''
    });
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
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Public Accounts Management ({filteredUsers.length} accounts)
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setEditingUser(null);
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Edit Public Account' : 'Create New Public Account'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nic">NIC Number *</Label>
                      <Input
                        id="nic"
                        name="nic"
                        autoComplete="off"
                        value={formData.nic}
                        onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number *</Label>
                      <Input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        autoComplete="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        name="username"
                        autoComplete="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password {!editingUser && '*'}</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={editingUser ? "new-password" : "new-password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required={!editingUser}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select value={formData.department_id} onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="division">Division</Label>
                      <Select value={formData.division_id} onValueChange={(value) => setFormData(prev => ({ ...prev, division_id: value }))}>
                        <SelectTrigger id="division">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map((div) => (
                            <SelectItem key={div.id} value={div.id.toString()}>
                              {div.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      autoComplete="address-line1"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingUser ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
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

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Public ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-blue-600" />
                        {user.public_id}
                      </div>
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.nic}</TableCell>
                    <TableCell>{user.mobile}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.department_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No public accounts found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the public account for{' '}
              <strong>{deletingUser?.name}</strong> (ID: {deletingUser?.public_id})?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. All associated registry entries and tokens will also be removed.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicAccountsManagement;
