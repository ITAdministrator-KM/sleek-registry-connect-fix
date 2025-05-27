import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import DepartmentForm from './forms/DepartmentForm';
import DepartmentTable from './tables/DepartmentTable';
import { apiService } from '@/services/api';

interface Department {
  id: string;
  name: string;
  description: string;
  documentsCount: number;
  createdAt: string;
}

interface ApiDepartment {
  id: number;
  name: string;
  description: string | null;
  division_count: string;
  created_at?: string;
  status: string;
}

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getDepartments();
      const apiDepartments = response as ApiDepartment[];
      const formattedDepartments = apiDepartments.map(dept => ({
        id: dept.id.toString(),
        name: dept.name,
        description: dept.description || '',
        documentsCount: parseInt(dept.division_count) || 0,
        createdAt: dept.created_at || new Date().toISOString().split('T')[0]
      }));
      setDepartments(formattedDepartments);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch departments. Please try again later.",
        variant: "destructive",
      });
      console.error('Error fetching departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: { name: string; description: string }) => {
    try {
      if (editingDepartment) {
        await apiService.updateDepartment({
          id: parseInt(editingDepartment.id),
          ...formData
        });
        toast({
          title: "Success",
          description: "Department updated successfully",
        });
      } else {
        await apiService.createDepartment(formData);
        toast({
          title: "Success",
          description: "Department created successfully",
        });
      }
      // Refresh the departments list
      await fetchDepartments();
      setEditingDepartment(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: editingDepartment 
          ? "Failed to update department" 
          : "Failed to create department",
        variant: "destructive",
      });
      console.error('Error handling department:', error);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteDepartment(parseInt(id));
      await fetchDepartments();
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive",
      });
      console.error('Error deleting department:', error);
    }
  };

  const handleCancel = () => {
    setEditingDepartment(null);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
