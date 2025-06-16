
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Department, Division } from '@/services/apiService';

const userSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'Name is required'),
  nic: z.string().min(10, 'NIC must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'staff', 'public']),
  department_id: z.string().optional(),
  division_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('active')
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  departments: Department[];
  divisions: Division[];
  editingUser?: any;
}

const UserForm = ({ onSubmit, onCancel, departments, divisions, editingUser }: UserFormProps) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: editingUser ? {
      id: editingUser.id,
      name: editingUser.name,
      nic: editingUser.nic || '',
      email: editingUser.email,
      username: editingUser.username,
      role: editingUser.role,
      department_id: editingUser.department_id?.toString() || '',
      division_id: editingUser.division_id?.toString() || '',
      status: editingUser.status,
    } : {
      role: 'staff',
      status: 'active'
    }
  });

  const selectedDepartmentId = watch('department_id');
  const filteredDivisions = divisions.filter(d => 
    selectedDepartmentId ? d.department_id === parseInt(selectedDepartmentId) : false
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="nic">NIC Number *</Label>
          <Input
            id="nic"
            {...register('nic')}
            placeholder="123456789V"
          />
          {errors.nic && (
            <p className="text-sm text-red-500">{errors.nic.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            {...register('username')}
            placeholder="johndoe"
          />
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password {!editingUser && '*'}</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder={editingUser ? "Leave blank to keep current password" : "Minimum 6 characters"}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={watch('role') || ''}
            onValueChange={(value) => setValue('role', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department_id">Department</Label>
          <Select
            value={watch('department_id') || ''}
            onValueChange={(value) => {
              setValue('department_id', value);
              setValue('division_id', '');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50 max-h-48 overflow-y-auto">
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="division_id">Division</Label>
          <Select
            value={watch('division_id') || ''}
            onValueChange={(value) => setValue('division_id', value)}
            disabled={!selectedDepartmentId || filteredDivisions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !selectedDepartmentId 
                  ? "Select department first" 
                  : filteredDivisions.length === 0 
                    ? "No divisions available" 
                    : "Select division"
              } />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredDivisions.map((div) => (
                <SelectItem key={div.id} value={div.id.toString()}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={watch('status') || 'active'}
          onValueChange={(value) => setValue('status', value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {editingUser ? 'Update' : 'Create'} User
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
