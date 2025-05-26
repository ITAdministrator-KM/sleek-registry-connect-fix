import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, FileText, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
  description: string;
  documentsCount: number;
  createdAt: string;
}

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: '1',
      name: 'Health Services',
      description: 'Manages public health services and medical facilities',
      documentsCount: 12,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Education',
      description: 'Oversees educational institutions and programs',
      documentsCount: 8,
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      name: 'Agriculture',
      description: 'Supports agricultural development and farmer assistance',
      documentsCount: 15,
      createdAt: '2024-02-01'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Department description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (editingDepartment) {
      // Update existing department
      setDepartments(departments.map(dept => 
        dept.id === editingDepartment.id 
          ? { ...dept, ...formData }
          : dept
      ));
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
    } else {
      // Create new department
      const newDepartment: Department = {
        id: Date.now().toString(),
        ...formData,
        documentsCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setDepartments([...departments, newDepartment]);
      toast({
        title: "Success",
        description: "Department created successfully",
      });
    }

    setFormData({ name: '', description: '' });
    setEditingDepartment(null);
    setIsDialogOpen(false);
    setErrors({});
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDepartments(departments.filter(dept => dept.id !== id));
    toast({
      title: "Success",
      description: "Department deleted successfully",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Uploaded",
        description: `${file.name} uploaded successfully`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Department Management</h2>
          <p className="text-gray-600 mt-2">Manage organizational departments and their information</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setEditingDepartment(null);
                setFormData({ name: '', description: '' });
                setErrors({});
              }}
              aria-label="Add new department"
            >
              <Plus className="mr-2" size={20} aria-hidden="true" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" aria-labelledby="dialog-title" aria-describedby="dialog-description">
            <DialogHeader>
              <DialogTitle id="dialog-title">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </DialogTitle>
              <DialogDescription id="dialog-description">
                {editingDepartment ? 'Update department information' : 'Create a new department with name and description'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="dept-name" className="text-gray-700 font-medium">
                  Department Name <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <Input
                  id="dept-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="Enter department name"
                  required
                  aria-required="true"
                  aria-describedby={errors.name ? "name-error" : "name-help"}
                  aria-invalid={!!errors.name}
                />
                <small id="name-help" className="text-sm text-gray-500">
                  Enter a unique name for the department
                </small>
                {errors.name && (
                  <div id="name-error" className="text-sm text-red-600" role="alert">
                    {errors.name}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dept-description" className="text-gray-700 font-medium">
                  Description <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <Textarea
                  id="dept-description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: '' }));
                    }
                  }}
                  placeholder="Enter department description"
                  rows={4}
                  required
                  aria-required="true"
                  aria-describedby={errors.description ? "description-error" : "description-help"}
                  aria-invalid={!!errors.description}
                />
                <small id="description-help" className="text-sm text-gray-500">
                  Provide a detailed description of the department's role
                </small>
                {errors.description && (
                  <div id="description-error" className="text-sm text-red-600" role="alert">
                    {errors.description}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dept-documents" className="text-gray-700 font-medium">
                  Upload Documents (Optional)
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="dept-documents"
                    name="documents"
                    type="file"
                    onChange={handleFileUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    aria-describedby="documents-help"
                  />
                  <Upload className="text-gray-400" size={20} aria-hidden="true" />
                </div>
                <small id="documents-help" className="text-sm text-gray-500">
                  Upload relevant documents (PDF, DOC, DOCX, TXT)
                </small>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  aria-describedby="submit-help"
                >
                  {editingDepartment ? 'Update' : 'Create'} Department
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                  aria-label="Cancel and close dialog"
                >
                  Cancel
                </Button>
                <small id="submit-help" className="sr-only">
                  {editingDepartment ? 'Update the department information' : 'Create a new department'}
                </small>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Departments Overview</CardTitle>
          <CardDescription>
            Total departments: {departments.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{department.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <FileText size={16} className="text-blue-600" aria-hidden="true" />
                      <span>{department.documentsCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>{department.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(department)}
                        className="text-blue-600 hover:text-blue-700"
                        aria-label={`Edit ${department.name} department`}
                      >
                        <Edit size={16} aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(department.id)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Delete ${department.name} department`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {departments.map((department) => (
          <Card key={department.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{department.name}</CardTitle>
              <CardDescription>{department.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText size={16} aria-hidden="true" />
                  <span>{department.documentsCount} documents</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(department)}
                    aria-label={`Edit ${department.name} department`}
                  >
                    <Edit size={16} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DepartmentManagement;
