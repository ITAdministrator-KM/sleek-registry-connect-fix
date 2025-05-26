
import { useState } from 'react';
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

interface Division {
  id: string;
  name: string;
  department: string;
  description: string;
  createdAt: string;
}

const DivisionManagement = () => {
  const [divisions, setDivisions] = useState<Division[]>([
    {
      id: '1',
      name: 'Primary Healthcare',
      department: 'Health Services',
      description: 'Manages basic healthcare services and clinics',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Emergency Services',
      department: 'Health Services',
      description: 'Handles emergency medical responses',
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      name: 'Primary Education',
      department: 'Education',
      description: 'Oversees primary schools and early education',
      createdAt: '2024-02-01'
    }
  ]);

  const departments = ['Health Services', 'Education', 'Agriculture', 'Social Services'];
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    description: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.department || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (editingDivision) {
      setDivisions(divisions.map(div => 
        div.id === editingDivision.id 
          ? { ...div, ...formData }
          : div
      ));
      toast({
        title: "Success",
        description: "Division updated successfully",
      });
    } else {
      const newDivision: Division = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setDivisions([...divisions, newDivision]);
      toast({
        title: "Success",
        description: "Division created successfully",
      });
    }

    setFormData({ name: '', department: '', description: '' });
    setEditingDivision(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (division: Division) => {
    setEditingDivision(division);
    setFormData({
      name: division.name,
      department: division.department,
      description: division.description
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDivisions(divisions.filter(div => div.id !== id));
    toast({
      title: "Success",
      description: "Division deleted successfully",
    });
  };

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
                setFormData({ name: '', department: '', description: '' });
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
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
