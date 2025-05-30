
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertCircle } from 'lucide-react';
import type { PublicUser } from '@/services/api';
import { IDCardValidator } from '../id-card/IDCardValidator';

interface PublicUserTableProps {
  users: PublicUser[];
  onEdit: (user: PublicUser) => void;
  onDelete: (user: PublicUser) => void;
}

export const PublicUserTable = ({ users, onEdit, onDelete }: PublicUserTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Public ID</th>
            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Name</th>
            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">NIC</th>
            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Mobile</th>
            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Department</th>
            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">QR Status</th>
            <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Created</th>
            <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-4 py-3 font-medium">{user.public_id}</td>
              <td className="border border-gray-200 px-4 py-3">{user.name}</td>
              <td className="border border-gray-200 px-4 py-3">{user.nic}</td>
              <td className="border border-gray-200 px-4 py-3">{user.mobile}</td>
              <td className="border border-gray-200 px-4 py-3">
                {user.department_name || '-'}
              </td>
              <td className="border border-gray-200 px-4 py-3">
                {IDCardValidator.validateQRCode(user.qr_code || '') ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Invalid
                  </Badge>
                )}
              </td>
              <td className="border border-gray-200 px-4 py-3">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="border border-gray-200 px-4 py-3">
                <div className="flex justify-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(user)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No public accounts found
        </div>
      )}
    </div>
  );
};
