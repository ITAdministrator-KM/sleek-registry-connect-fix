
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import type { PublicUser } from '@/services/api';
import { apiService } from '@/services/api';

interface PublicUserFormProps {
  user?: PublicUser | null;
  onSubmit: (userData: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const PublicUserForm = ({ user, onSubmit, onClose, isLoading }: PublicUserFormProps) => {
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

  const [departments, setDepartments] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartments();
    
    if (user) {
      setFormData({
        name: user.name || '',
        nic: user.nic || '',
        address: user.address || '',
        mobile: user.mobile || '',
        email: user.email || '',
        username: user.username || '',
        password: '',
        department_id: user.department_id?.toString() || '',
        division_id: user.division_id?.toString() || ''
      });
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const depts = await apiService.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async (departmentId: string) => {
    try {
      const divs = await apiService.getDivisions();
      const filteredDivisions = divs.filter(div => div.department_id === parseInt(departmentId));
      setDivisions(filteredDivisions);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      department_id: formData.department_id ? parseInt(formData.department_id) : null,
      division_id: formData.division_id ? parseInt(formData.division_id) : null
    };

    if (user) {
      submitData.id = user.id;
    }

    onSubmit(submitData);
  };

  const handleDepartmentChange = (value: string) => {
    setFormData(prev => ({ ...prev, department_id: value, division_id: '' }));
    if (value) {
      fetchDivisions(value);
    } else {
      setDivisions([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{user ? 'Edit Public Account' : 'Create Public Account'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="nic">NIC Number *</Label>
                <Input
                  id="nic"
                  value={formData.nic}
                  onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">{user ? 'New Password (optional)' : 'Password *'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={!user}
                />
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department_id} onValueChange={handleDepartmentChange}>
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
            
            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? 'Saving...' : user ? 'Update Account' : 'Create Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
