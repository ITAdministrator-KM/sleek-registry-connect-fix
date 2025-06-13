import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department_id: number;
}

type UserRole = 'admin' | 'staff' | 'public';

interface UserData {
  id?: number;  // Make id optional
  name: string;
  nic: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  department_id: number | null;
  division_id: number | null;
  [key: string]: any; // Add index signature to allow dynamic property access
}

interface UserFormProps {
  user?: {
    id: number;
    name: string;
    nic: string;
    email: string;
    username: string;
    role: UserRole;
    department_id?: number;
    division_id?: number;
  } | null;
  onSubmit: (data: UserData) => void;
  onCancel: () => void;
}

const UserForm = ({ user, onSubmit, onCancel }: UserFormProps) => {
  const [formData, setFormData] = useState<UserData>({
    name: user?.name || '',
    nic: user?.nic || '',
    email: user?.email || '',
    username: user?.username || '',
    password: '',
    role: (user?.role as UserRole) || 'staff',
    department_id: user?.department_id || null,
    division_id: user?.division_id || null
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      // Type assertion to ensure the response is properly typed
      setDepartments(Array.isArray(response) ? response as Department[] : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiService.getDivisions();
      // Type assertion to ensure the response is properly typed
      setDivisions(Array.isArray(response) ? response as Division[] : []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must not exceed 100 characters';
    }

    // NIC validation
    if (!formData.nic.trim()) {
      newErrors.nic = 'NIC number is required';
    } else if (!/^\d{9}[vVxX]$|^\d{12}$/.test(formData.nic)) {
      newErrors.nic = 'Invalid NIC format. Use 9 digits + V/X or 12 digits';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must not exceed 50 characters';
    } else if (!/^[a-zA-Z0-9_\-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }

    // Password validation
    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (formData.password && formData.password.length > 128) {
      newErrors.password = 'Password must not exceed 128 characters';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again",
        variant: "destructive",
      });
      
      // Focus the first field with an error
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const element = document.querySelector(`[name="${firstError}"]`);
        if (element && element instanceof HTMLElement) {
          element.focus();
        }
      }
      return;
    }

    setIsLoading(true);
    
    // Create a new object with the form data
    const formSubmission: Partial<UserData> = { ...formData };
    
    // Remove password field if it's empty (for updates)
    if (formSubmission.id && !formSubmission.password) {
      delete formSubmission.password;
    }
    
    // Call the onSubmit handler with the prepared data
    onSubmit(formSubmission as UserData);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4" 
      noValidate
      role="form"
      aria-label={`${user ? 'Edit' : 'Create'} User Form`}
    >
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
            minLength={2}
            maxLength={100}
            autoComplete="name"
            autoCapitalize="words"
            aria-required="true"
            aria-describedby={errors.name ? "name-error" : "name-help"}
            aria-invalid={!!errors.name}
          />
          <small id="name-help" className="text-sm text-gray-500">
            Enter the user's full name (2-100 characters)
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
            pattern="^\d{9}[vVxX]$|^\d{12}$"
            autoComplete="off"
            inputMode="numeric"
            aria-required="true"
            aria-describedby={errors.nic ? "nic-error" : "nic-help"}
            aria-invalid={!!errors.nic}
          />
          <small id="nic-help" className="text-sm text-gray-500">
            Enter the National Identity Card number (9 digits + V/X or 12 digits)
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
          autoComplete="email"
          spellCheck="false"
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
            minLength={3}
            maxLength={50}
            pattern="^[a-zA-Z0-9_\-]+$"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            aria-required="true"
            aria-describedby={errors.username ? "username-error" : "username-help"}
            aria-invalid={!!errors.username}
          />
          <small id="username-help" className="text-sm text-gray-500">
            Choose a unique username (3-50 characters, letters, numbers, underscore, hyphen only)
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
            minLength={8}
            maxLength={128}
            autoComplete={user ? "new-password" : "current-password"}
            aria-required={!user}
            aria-describedby={errors.password ? "password-error" : "password-help"}
            aria-invalid={!!errors.password}
          />
          <small id="password-help" className="text-sm text-gray-500">
            {user ? "Leave blank to keep current password" : "Enter a secure password (minimum 8 characters)"}
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
            onValueChange={(value: UserRole) => {
              setFormData({ ...formData, role: value });
              if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
            }}
            name="user-role"
            defaultValue={formData.role}
            required
            aria-required="true"
            aria-invalid={!!errors.role}
            aria-describedby="role-help"
        >
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin" role="option">Administrator</SelectItem>
              <SelectItem value="staff" role="option">Staff Member</SelectItem>
              <SelectItem value="public" role="option">Public User</SelectItem>
            </SelectContent>
          </Select>
          <small id="role-help" className="text-sm text-gray-500">
            Select the user's role in the system
          </small>
          {errors.role && (
            <div id="role-error" className="text-sm text-red-600" role="alert">
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
            value={formData.department_id?.toString() || 'none'} 
            onValueChange={(value) => {
              setFormData({ 
                ...formData, 
                department_id: value === 'none' ? null : parseInt(value),
                division_id: null 
              });
              // Clear any division errors when department changes
              if (errors.division_id) {
                setErrors(prev => ({ ...prev, division_id: '' }));
              }
            }}
            name="user-department"
            defaultValue={formData.department_id?.toString() || 'none'}
            aria-describedby="department-help"
            aria-required="false"
            disabled={isLoading}
          >
            <SelectTrigger 
              id="user-department" 
              className="w-full"
              aria-label="Select department"
            >
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" role="option">None</SelectItem>
              {departments.map((dept: Department) => (
                <SelectItem 
                  key={dept.id} 
                  value={dept.id.toString()}
                  role="option"
                >
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <small id="department-help" className="text-sm text-gray-500">
            Select the user's department (optional)
          </small>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-division" className="text-gray-700 font-medium">
            Division
          </Label>
          <Select 
            value={formData.division_id?.toString() || 'none'} 
            onValueChange={(value) => {
              setFormData({ ...formData, division_id: value === 'none' ? null : parseInt(value) });
              if (errors.division_id) {
                setErrors(prev => ({ ...prev, division_id: '' }));
              }
            }}
            name="user-division"
            defaultValue={formData.division_id?.toString() || 'none'}
            aria-describedby={errors.division_id ? "division-error" : "division-help"}
            aria-required="false"
            aria-invalid={!!errors.division_id}
            disabled={!formData.department_id || isLoading}
          >
            <SelectTrigger 
              id="user-division" 
              className="w-full"
              aria-label="Select division"
            >
              <SelectValue placeholder={formData.department_id ? "Select division" : "Select department first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" role="option">None</SelectItem>
              {divisions
                .filter((div: Division) => div.department_id === formData.department_id)
                .map((div: Division) => (
                  <SelectItem 
                    key={div.id} 
                    value={div.id.toString()}
                    role="option"
                  >
                    {div.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <small id="division-help" className="text-sm text-gray-500">
            {!formData.department_id 
              ? "Please select a department first"
              : divisions.filter(div => div.department_id === formData.department_id).length === 0
              ? "No divisions available for selected department"
              : "Select the user's division within the department (optional)"}
          </small>
          {errors.division_id && (
            <div id="division-error" className="text-sm text-red-600" role="alert">
              {errors.division_id}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button 
          type="submit" 
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              {user ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <>{user ? 'Update' : 'Create'} User</>
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
