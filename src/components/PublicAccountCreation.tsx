import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department_id: number;
}

interface PublicUser {
  id: number;
  public_id: string;
  name: string;
  nic: string;
  address: string;
  mobile: string;
  email?: string;
  department_name?: string;
  division_name?: string;
  created_at: string;
}

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nic: z.string().min(10, 'NIC must be at least 10 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  mobile: z.string().regex(/^\+?[0-9]{10,}$/, 'Invalid mobile number'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(4, 'Username must be at least 4 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  department_id: z.string().optional(),
  division_id: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const PublicAccountCreation = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Form state
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      department_id: undefined,
      division_id: undefined
    }
  });

  // Watch department_id for division filtering
  const selectedDepartmentId = watch('department_id');

  const getFilteredDivisions = () => {
    if (!selectedDepartmentId) return [];
    return divisions.filter(d => d.department_id === parseInt(selectedDepartmentId));
  };

  // Reset division when department changes
  useEffect(() => {
    setValue('division_id', undefined);
  }, [selectedDepartmentId, setValue]);

  useEffect(() => {
    fetchPublicUsers();
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchPublicUsers = async () => {
    try {
      setIsLoading(true);
      const users = await apiService.getPublicUsers();
      setPublicUsers(users);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch public users",
        variant: "destructive",
      });
      setPublicUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiService.getDivisions();
      setDivisions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const response = await apiService.createPublicUser({
        name: data.name,
        nic: data.nic,
        address: data.address,
        mobile: data.mobile,
        email: data.email,
        username: data.username,
        password: data.password,
        department_id: data.department_id ? parseInt(data.department_id) : undefined,
        division_id: data.division_id ? parseInt(data.division_id) : undefined
      });

      // Handle both object response and direct user response
      if (response && (response.id || (typeof response === 'object' && 'status' in response && response.status === 'success'))) {
        toast({
          title: "Success",
          description: "Public account created successfully",
        });
        reset();
        setIsDialogOpen(false);
        fetchPublicUsers(); // Refresh the list
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      console.error('Error creating public account:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = publicUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department_name && user.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Public Accounts</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `Total accounts: ${publicUsers.length}`}
              </CardDescription>
            </div>
            <div className="flex space-x-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2" size={20} />
                    Create Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Public Account</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new public user account
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input                    id="name"
                          {...register('name')}
                          placeholder="Enter full name"
                          autoComplete="name"
                          required
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="nic">NIC Number *</Label>
                        <Input                    id="nic"
                          {...register('nic')}
                          placeholder="Enter NIC number"
                          autoComplete="off"
                          required
                        />
                        {errors.nic && (
                          <p className="text-sm text-red-500">{errors.nic.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Textarea                    id="address"
                          {...register('address')}
                          placeholder="Enter full address"
                          autoComplete="street-address"
                          required
                      />
                      {errors.address && (
                        <p className="text-sm text-red-500">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number *</Label>
                        <Input                    id="mobile"
                          {...register('mobile')}
                          placeholder="+94771234567"
                          autoComplete="tel"
                          required
                        />
                        {errors.mobile && (
                          <p className="text-sm text-red-500">{errors.mobile.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input                    id="email"
                          type="email"
                          {...register('email')}
                          placeholder="Enter email address"
                          autoComplete="email"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="public-department">Department (Optional)</Label>
                        <Select
                          name="department_id"
                          value={selectedDepartmentId}
                          onValueChange={(value) => setValue('department_id', value)}
                        >
                          <SelectTrigger id="public-department" className="w-full">
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
                        <small className="text-sm text-gray-500">Select your department if applicable</small>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="public-division">Division (Optional)</Label>
                        <Select
                          name="division_id"
                          value={watch('division_id')}
                          onValueChange={(value) => setValue('division_id', value)}
                          disabled={!selectedDepartmentId}
                        >
                          <SelectTrigger id="public-division" className="w-full">
                            <SelectValue placeholder={selectedDepartmentId ? "Select division" : "Select department first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredDivisions().map((div) => (
                              <SelectItem key={div.id} value={div.id.toString()}>
                                {div.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <small className="text-sm text-gray-500">
                          {!selectedDepartmentId 
                            ? "Please select a department first"
                            : getFilteredDivisions().length === 0
                            ? "No divisions available for selected department"
                            : "Select your division within the department if applicable"}
                        </small>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          {...register('username')}
                          placeholder="Enter username"
                          autoComplete="username"
                          required
                        />
                        {errors.username && (
                          <p className="text-sm text-red-500">{errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          {...register('password')}
                          placeholder="Enter password"
                          autoComplete="new-password"
                          required
                        />
                        {errors.password && (
                          <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...register('confirmPassword')}
                          placeholder="Confirm password"
                          autoComplete="new-password"
                          required
                        />
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? 'Creating...' : 'Create Account'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Public ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.public_id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.nic}</TableCell>
                    <TableCell>{user.mobile}</TableCell>
                    <TableCell>{user.department_name || '-'}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicAccountCreation;
