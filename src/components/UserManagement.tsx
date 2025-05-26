
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User, Mail, CreditCard } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  nic: string;
  email: string;
  username: string;
  password: string;
  role: 'Admin' | 'Staff';
  department: string;
  division: string;
  createdAt: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      nic: '199012345678',
      email: 'john.doe@dskalmunai.lk',
      username: 'john.doe',
      password: 'password123',
      role: 'Admin',
      department: 'Health Services',
      division: 'Primary Healthcare',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      nic: '199123456789',
      email: 'jane.smith@dskalmunai.lk',
      username: 'jane.smith',
      password: 'password456',
      role: 'Staff',
      department: 'Education',
      division: 'Primary Education',
      createdAt: '2024-01-20'
    }
  ]);

  const departments = ['Health Services', 'Education', 'Agriculture', 'Social Services'];
  const divisions = {
    'Health Services': ['Primary Healthcare', 'Emergency Services'],
    'Education': ['Primary Education', 'Secondary Education'],
    'Agriculture': ['Crop Development', 'Livestock'],
    'Social Services': ['Welfare Programs', 'Community Development']
  };
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    email: '',
    username: '',
    password: '',
    role: 'Staff' as 'Admin' | 'Staff',
    department: '',
    division: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nic || !formData.email || !formData.username || !formData.password || !formData.department || !formData.division) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate NIC format (simplified)
    if (formData.nic.length !== 10 && formData.nic.length !== 12) {
      toast({
        title: "Error",
        description: "NIC must be 10 or 12 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...formData }
          : user
      ));
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } else {
      // Check if username or email already exists
      const existingUser = users.find(u => u.username === formData.username || u.email === formData.email);
      if (existingUser) {
        toast({
          title: "Error",
          description: "Username or email already exists",
          variant: "destructive",
        });
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    }

    setFormData({
      name: '',
      nic: '',
      email: '',
      username: '',
      password: '',
      role: 'Staff',
      department: '',
      division: ''
    });
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      nic: user.nic,
      email: user.email,
      username: user.username,
      password: user.password,
      role: user.role,
      department: user.department,
      division: user.division
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
    toast({
      title: "Success",
      description: "User deleted successfully",
    });
  };

  const handleDepartmentChange = (department: string) => {
    setFormData({
      ...formData,
      department,
      division: '' // Reset division when department changes
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-600 mt-2">Manage staff accounts and permissions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  name: '',
                  nic: '',
                  email: '',
                  username: '',
                  password: '',
                  role: 'Staff',
                  department: '',
                  division: ''
                });
              }}
            >
              <Plus className="mr-2" size={20} />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user information' : 'Create a new user account with access permissions'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nic">NIC Number</Label>
                  <Input
                    id="nic"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    placeholder="Enter NIC number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: 'Admin' | 'Staff') => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Administrator</SelectItem>
                    <SelectItem value="Staff">Staff Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={handleDepartmentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Select 
                    value={formData.division} 
                    onValueChange={(value) => setFormData({ ...formData, division: value })}
                    disabled={!formData.department}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.department && divisions[formData.department as keyof typeof divisions]?.map((div) => (
                        <SelectItem key={div} value={div}>{div}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {editingUser ? 'Update' : 'Create'} User
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{users.length}</div>
            <p className="text-gray-500">Registered users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {users.filter(u => u.role === 'Admin').length}
            </div>
            <p className="text-gray-500">Admin accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {users.filter(u => u.role === 'Staff').length}
            </div>
            <p className="text-gray-500">Staff accounts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users Overview</CardTitle>
          <CardDescription>
            Manage user accounts and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>NIC</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department/Division</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <CreditCard size={16} className="text-gray-500" />
                      <span className="font-mono text-sm">{user.nic}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{user.department}</p>
                      <p className="text-xs text-gray-500">{user.division}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-700"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
