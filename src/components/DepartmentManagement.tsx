
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import DepartmentForm from './forms/DepartmentForm';
import DepartmentTable from './tables/DepartmentTable';

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
  const { toast } = useToast();

  const handleSubmit = (formData: { name: string; description: string }) => {
    if (editingDepartment) {
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

    setEditingDepartment(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDepartments(departments.filter(dept => dept.id !== id));
    toast({
      title: "Success",
      description: "Department deleted successfully",
    });
  };

  const handleCancel = () => {
    setEditingDepartment(null);
    setIsDialogOpen(false);
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
              }}
            >
              <Plus className="mr-2" size={20} />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment ? 'Update department information' : 'Create a new department with name and description'}
              </DialogDescription>
            </DialogHeader>
            
            <DepartmentForm
              department={editingDepartment}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
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
          <DepartmentTable
            departments={departments}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
                  <FileText size={16} />
                  <span>{department.documentsCount} documents</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(department)}
                >
                  <Edit size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DepartmentManagement;
