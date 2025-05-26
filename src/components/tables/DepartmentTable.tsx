
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, FileText } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string;
  documentsCount: number;
  createdAt: string;
}

interface DepartmentTableProps {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: (id: string) => void;
}

const DepartmentTable = ({ departments, onEdit, onDelete }: DepartmentTableProps) => {
  return (
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
                  onClick={() => onEdit(department)}
                  className="text-blue-600 hover:text-blue-700"
                  aria-label={`Edit ${department.name} department`}
                >
                  <Edit size={16} aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(department.id)}
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
  );
};

export default DepartmentTable;
