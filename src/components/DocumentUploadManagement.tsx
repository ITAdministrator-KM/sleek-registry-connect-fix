
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { departmentService, Department, Division } from '@/services/departmentService';

interface DocumentUploadManagementProps {
  onDocumentUploaded?: () => void;
}

const DocumentUploadManagement: React.FC<DocumentUploadManagementProps> = ({ onDocumentUploaded }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    document_name: '',
    department_id: '',
    division_id: '',
    description: '',
    document_type: 'word' as 'word' | 'excel'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDepartmentChange = async (departmentId: string) => {
    setFormData({ ...formData, department_id: departmentId, division_id: '' });
    
    if (departmentId) {
      try {
        const response = await departmentService.getDivisions(parseInt(departmentId));
        setDivisions(response.data || []);
      } catch (error) {
        console.error('Error fetching divisions:', error);
      }
    } else {
      setDivisions([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Automatically determine document type based on file extension
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension === 'xlsx' || extension === 'xls') {
        setFormData({ ...formData, document_type: 'excel' });
      } else if (extension === 'doc' || extension === 'docx') {
        setFormData({ ...formData, document_type: 'word' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('document_name', formData.document_name);
      uploadFormData.append('department_id', formData.department_id);
      uploadFormData.append('division_id', formData.division_id);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('document_type', formData.document_type);

      const response = await fetch('/backend/api/documents/upload.php', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document uploaded successfully",
        });
        
        setIsDialogOpen(false);
        setSelectedFile(null);
        setFormData({
          document_name: '',
          department_id: '',
          division_id: '',
          description: '',
          document_type: 'word'
        });
        
        if (onDocumentUploaded) {
          onDocumentUploaded();
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload Word or Excel documents to specific departments and divisions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="document_name">Document Name</Label>
            <Input
              id="document_name"
              name="document_name"
              value={formData.document_name}
              onChange={(e) => setFormData({...formData, document_name: e.target.value})}
              placeholder="Enter document name"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department_id} onValueChange={handleDepartmentChange}>
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
            <Select value={formData.division_id} onValueChange={(value) => setFormData({...formData, division_id: value})}>
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

          <div>
            <Label htmlFor="document_type">Document Type</Label>
            <Select value={formData.document_type} onValueChange={(value: 'word' | 'excel') => setFormData({...formData, document_type: value})}>
              <SelectTrigger id="document_type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="word">Word Document</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              onChange={handleFileChange}
              accept=".doc,.docx,.xls,.xlsx"
              required
            />
            {selectedFile && (
              <div className="flex items-center mt-2 p-2 bg-gray-50 rounded">
                <FileText className="h-4 w-4 mr-2" />
                <span className="text-sm">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter document description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Upload Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadManagement;
