
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';
import { Department } from '@/services/departmentService';

interface ApiDivision {
  id: number;
  name: string;
  description: string | null;
  department_id: number;
  department_name: string;
  created_at?: string;
  status: string;
}

interface Division {
  id: string;
  name: string;
  department: string;
  departmentId: number;
  description: string;
  createdAt: string;
}

const DivisionManagement = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    departmentId: 0,
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      // Ensure description is always a string for consistency
      const normalizedDepartments = response.map(dept => ({
        ...dept,
        description: dept.description || ''
      }));
      setDepartments(normalizedDepartments);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getDivisions();
      const apiDivisions = response as ApiDivision[];
      const formattedDivisions = apiDivisions.map(div => ({
        id: div.id.toString(),
        name: div.name,
        department: div.department_name,
        departmentId: div.department_id,
        description: div.description || '',
        createdAt: div.created_at || new Date().toISOString().split('T')[0]
      }));
      setDivisions(formattedDivisions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch divisions",
        variant: "destructive",
      });
      console.error('Error fetching divisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.departmentId || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDivision) {
        await apiService.updateDivision({
          id: parseInt(editingDivision.id),
          name: formData.name,
          department_id: formData.departmentId,
          description: formData.description
        });
        toast({
          title: "Success",
          description: "Division updated successfully",
        });
      } else {
        await apiService.createDivision({
          name: formData.name,
          department_id: formData.departmentId,
          description: formData.description
        });
        toast({
          title: "Success",
          description: "Division created successfully",
        });
      }
      
      await fetchDivisions();
      setFormData({ name: '', departmentId: 0, description: '' });
      setEditingDivision(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: editingDivision
          ? "Failed to update division"
          : "Failed to create division",
        variant: "destructive",
      });
      console.error('Error handling division:', error);
    }
  };

  const handleEdit = (division: Division) => {
    setEditingDivision(division);
    setFormData({
      name: division.name,
      departmentId: division.departmentId,
      description: division.description
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteDivision(parseInt(id));
      await fetchDivisions();
      toast({
        title: "Success",
        description: "Division deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete division",
        variant: "destructive",
      });
      console.error('Error deleting division:', error);
    }
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
          <h2 className="text-3xl font-bold text-gray-800">Division Management</h2>
          <p className="text-gray-600 mt-2">Manage divisions within departments</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setEditingDivision(null);
                setFormData({ name: '', departmentId: 0, description: '' });
              }}
            >
              <Plus className="mr-2" size={20} />
              Add Division
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDivision ? 'Edit Division' : 'Add New Division'}
              </DialogTitle>
              <DialogDescription>
                {editingDivision ? 'Update division information' : 'Create a new division under a department'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Division Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter division name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>                <Select 
                  value={formData.departmentId ? formData.departmentId.toString() : undefined}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments
                      .filter(dept => dept.status !== 'inactive')
                      .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter division description"
                  rows={4}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  {editingDivision ? 'Update' : 'Create'} Division
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

      <Card>
        <CardHeader>
          <CardTitle>Divisions Overview</CardTitle>
          <CardDescription>
            Total divisions: {divisions.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.map((division) => (
                <TableRow key={division.id}>
                  <TableCell className="font-medium">{division.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building size={16} className="text-blue-600" />
                      <span>{division.department}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{division.description}</TableCell>
                  <TableCell>{division.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(division)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(division.id)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisions.map((division) => (
          <Card key={division.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{division.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Building size={16} className="text-blue-600" />
                <span>{division.department}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">{division.description}</p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(division)}
                  className="flex-1"
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DivisionManagement;
