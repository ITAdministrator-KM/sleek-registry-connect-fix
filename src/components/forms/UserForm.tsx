
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';

interface UserFormProps {
  user?: {
    id: number;
    name: string;
    nic: string;
    email: string;
    username: string;
    role: string;
    department_id?: number;
    division_id?: number;
  } | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const UserForm = ({ user, onSubmit, onCancel }: UserFormProps) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    nic: user?.nic || '',
    email: user?.email || '',
    username: user?.username || '',
    password: '',
    role: user?.role || '',
    department_id: user?.department_id || '',
    division_id: user?.division_id || ''
  });
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiService.getDivisions();
      setDivisions(response);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.nic.trim()) newErrors.nic = 'NIC is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!user && !formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.role) newErrors.role = 'Role is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user-name" className="text-gray-700 font-medium">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="user-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
            placeholder="Enter full name"
            required
            aria-required="true"
            aria-describedby={errors.name ? "name-error" : "name-help"}
            aria-invalid={!!errors.name}
          />
          <small id="name-help" className="text-sm text-gray-500">
            Enter the user's full name
          </small>
          {errors.name && (
            <div id="name-error" className="text-sm text-red-600" role="alert">
              {errors.name}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-nic" className="text-gray-700 font-medium">
            NIC Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="user-nic"
            name="nic"
            type="text"
            value={formData.nic}
            onChange={(e) => {
              setFormData({ ...formData, nic: e.target.value });
              if (errors.nic) setErrors(prev => ({ ...prev, nic: '' }));
            }}
            placeholder="Enter NIC number"
            required
            aria-required="true"
            aria-describedby={errors.nic ? "nic-error" : "nic-help"}
            aria-invalid={!!errors.nic}
          />
          <small id="nic-help" className="text-sm text-gray-500">
            Enter the National Identity Card number
          </small>
          {errors.nic && (
            <div id="nic-error" className="text-sm text-red-600" role="alert">
              {errors.nic}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email" className="text-gray-700 font-medium">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="user-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
          }}
          placeholder="Enter email address"
          required
          aria-required="true"
          aria-describedby={errors.email ? "email-error" : "email-help"}
          aria-invalid={!!errors.email}
        />
        <small id="email-help" className="text-sm text-gray-500">
          Enter a valid email address
        </small>
        {errors.email && (
          <div id="email-error" className="text-sm text-red-600" role="alert">
            {errors.email}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user-username" className="text-gray-700 font-medium">
            Username <span className="text-red-500">*</span>
          </Label>
          <Input
            id="user-username"
            name="username"
            type="text"
            value={formData.username}
            onChange={(e) => {
              setFormData({ ...formData, username: e.target.value });
              if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
            }}
            placeholder="Enter username"
            required
            aria-required="true"
            aria-describedby={errors.username ? "username-error" : "username-help"}
            aria-invalid={!!errors.username}
          />
          <small id="username-help" className="text-sm text-gray-500">
            Choose a unique username
          </small>
          {errors.username && (
            <div id="username-error" className="text-sm text-red-600" role="alert">
              {errors.username}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-password" className="text-gray-700 font-medium">
            Password {!user && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="user-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
            }}
            placeholder={user ? "Leave blank to keep current password" : "Enter password"}
            required={!user}
            aria-required={!user}
            aria-describedby={errors.password ? "password-error" : "password-help"}
            aria-invalid={!!errors.password}
          />
          <small id="password-help" className="text-sm text-gray-500">
            {user ? "Leave blank to keep current password" : "Enter a secure password"}
          </small>
          {errors.password && (
            <div id="password-error" className="text-sm text-red-600" role="alert">
              {errors.password}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-role" className="text-gray-700 font-medium">
          Role <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => {
            setFormData({ ...formData, role: value });
            if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
          }}
          name="role"
          required
          aria-required="true"
        >
          <SelectTrigger id="user-role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="staff">Staff Member</SelectItem>
            <SelectItem value="public">Public User</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <div className="text-sm text-red-600" role="alert">
            {errors.role}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user-department" className="text-gray-700 font-medium">
            Department
          </Label>
          <Select 
            value={formData.department_id.toString()} 
            onValueChange={(value) => setFormData({ ...formData, department_id: parseInt(value) })}
            name="department"
          >
            <SelectTrigger id="user-department">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-division" className="text-gray-700 font-medium">
            Division
          </Label>
          <Select 
            value={formData.division_id.toString()} 
            onValueChange={(value) => setFormData({ ...formData, division_id: parseInt(value) })}
            name="division"
          >
            <SelectTrigger id="user-division">
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((div: any) => (
                <SelectItem key={div.id} value={div.id.toString()}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button 
          type="submit" 
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {user ? 'Update' : 'Create'} User
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
