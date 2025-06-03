
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Building, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || (editingDivision
          ? "Failed to update division"
          : "Failed to create division"),
        variant: "destructive",
      });
      console.error('Error handling division:', error);
    } finally {
      setIsSubmitting(false);
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
    if (!confirm('Are you sure you want to delete this division? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteDivision(parseInt(id));
      await fetchDivisions();
      toast({
        title: "Success",
        description: "Division deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete division",
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
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-3">Division Management</h2>
        <p className="text-purple-100 text-lg">Organize departments into specialized divisions</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
            <Building className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Total Divisions: {divisions.length}</span>
          </div>
          <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Active Divisions</span>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 rounded-xl px-6 py-3"
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
              <DialogTitle className="text-xl font-bold text-gray-800">
                {editingDivision ? 'Edit Division' : 'Create New Division'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingDivision ? 'Update division information' : 'Create a new division under a department'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Division Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter division name"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department</Label>
                <Select 
                  value={formData.departmentId ? formData.departmentId.toString() : undefined}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: parseInt(value) })}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter division description"
                  rows={4}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200"
                >
                  {isSubmitting ? 'Processing...' : (editingDivision ? 'Update Division' : 'Create Division')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-t-lg">
          <CardTitle className="text-gray-800 flex items-center gap-3">
            <Building className="h-6 w-6" />
            Divisions Overview
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage and organize divisions within departments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Department</TableHead>
                <TableHead className="font-semibold text-gray-700">Description</TableHead>
                <TableHead className="font-semibold text-gray-700">Created</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.map((division) => (
                <TableRow key={division.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium text-gray-800">{division.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building size={16} className="text-blue-600" />
                      <span className="text-gray-700">{division.department}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-gray-600 text-sm truncate" title={division.description}>
                      {division.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{division.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(division)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(division.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {divisions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-3">
                      <AlertCircle className="h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">No divisions found</p>
                      <p className="text-gray-400 text-sm">Create your first division to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DivisionManagement;
