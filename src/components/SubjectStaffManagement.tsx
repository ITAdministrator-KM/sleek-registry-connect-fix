
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { subjectService, SubjectStaff } from '@/services/subjectService';
import { userService } from '@/services/userService';
import { departmentService, Department, Division } from '@/services/departmentService';
import DocumentUploadManagement from './DocumentUploadManagement';

const SubjectStaffManagement = () => {
  const [subjectStaffList, setSubjectStaffList] = useState<SubjectStaff[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubjectStaff, setEditingSubjectStaff] = useState<SubjectStaff | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    post: '',
    assigned_department_id: '',
    assigned_division_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectStaffResponse, usersResponse, departmentsResponse] = await Promise.all([
        subjectService.getSubjectStaffData(0), // Pass 0 to get all staff
        userService.getUsers(),
        departmentService.getDepartments()
      ]);
      
      // Handle subjectStaffResponse - it could be a single item or array
      if (Array.isArray(subjectStaffResponse.data)) {
        setSubjectStaffList(subjectStaffResponse.data);
      } else if (subjectStaffResponse.data) {
        setSubjectStaffList([subjectStaffResponse.data]);
      } else {
        setSubjectStaffList([]);
      }
      
      setUsers(usersResponse || []);
      setDepartments(departmentsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = async (departmentId: string) => {
    setFormData({ ...formData, assigned_department_id: departmentId, assigned_division_id: '' });
    
    if (departmentId) {
      try {
        const divisionsResponse = await departmentService.getDivisions(parseInt(departmentId));
        setDivisions(divisionsResponse.data || []);
      } catch (error) {
        console.error('Error fetching divisions:', error);
      }
    } else {
      setDivisions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const numericFormData = {
        user_id: parseInt(formData.user_id),
        post: formData.post,
        assigned_department_id: parseInt(formData.assigned_department_id),
        assigned_division_id: parseInt(formData.assigned_division_id)
      };

      if (editingSubjectStaff) {
        await subjectService.updateSubjectStaff(editingSubjectStaff.id, numericFormData);
        toast({
          title: "Success",
          description: "Subject staff updated successfully",
        });
      } else {
        await subjectService.createSubjectStaff(numericFormData);
        toast({
          title: "Success",
          description: "Subject staff created successfully",
        });
      }
      
      setIsDialogOpen(false);
      setEditingSubjectStaff(null);
      setFormData({
        user_id: '',
        post: '',
        assigned_department_id: '',
        assigned_division_id: ''
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save subject staff",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (subjectStaff: SubjectStaff) => {
    setEditingSubjectStaff(subjectStaff);
    setFormData({
      user_id: subjectStaff.user_id.toString(),
      post: subjectStaff.post,
      assigned_department_id: subjectStaff.assigned_department_id.toString(),
      assigned_division_id: subjectStaff.assigned_division_id.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this subject staff?')) {
      try {
        await subjectService.deleteSubjectStaff(id);
        toast({
          title: "Success",
          description: "Subject staff deleted successfully",
        });
        fetchData();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete subject staff",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading subject staff...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Subject Staff Management
              </CardTitle>
              <CardDescription>
                Manage subject staff accounts and upload documents to divisions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <DocumentUploadManagement onDocumentUploaded={fetchData} />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Subject Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSubjectStaff ? 'Edit Subject Staff' : 'Create New Subject Staff'}
                    </DialogTitle>
                    <DialogDescription>
                      Assign a user as subject staff to a specific department and division.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="user_id">User</Label>
                      <Select value={formData.user_id} onValueChange={(value) => setFormData({...formData, user_id: value})}>
                        <SelectTrigger id="user_id">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="post">Post/Job Title</Label>
                      <Input
                        id="post"
                        name="post"
                        value={formData.post}
                        onChange={(e) => setFormData({...formData, post: e.target.value})}
                        placeholder="Enter job title/post"
                        required
                        autoComplete="organization-title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select value={formData.assigned_department_id} onValueChange={handleDepartmentChange}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
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
                      <Select value={formData.assigned_division_id} onValueChange={(value) => setFormData({...formData, assigned_division_id: value})}>
                        <SelectTrigger id="division">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {divisions.map((div) => (
                            <SelectItem key={div.id} value={div.id.toString()}>
                              {div.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingSubjectStaff ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectStaffList.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.user_id}</TableCell>
                  <TableCell>{staff.post}</TableCell>
                  <TableCell>{staff.department_name}</TableCell>
                  <TableCell>{staff.division_name}</TableCell>
                  <TableCell>
                    <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                      {staff.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(staff)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(staff.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
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

export default SubjectStaffManagement;
