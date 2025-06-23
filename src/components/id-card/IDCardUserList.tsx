
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer } from 'lucide-react';
import type { PublicUser } from '@/services/apiService';

interface IDCardUserListProps {
  users: PublicUser[];
  selectedUsers: number[];
  onUserSelect: (userId: number) => void;
  onPrintSingle: (user: PublicUser) => void;
}

const IDCardUserList: React.FC<IDCardUserListProps> = ({
  users,
  selectedUsers,
  onUserSelect,
  onPrintSingle
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <Checkbox
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={() => onUserSelect(user.id)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPrintSingle(user)}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{user.name}</p>
              <p className="text-gray-600">ID: {user.public_id}</p>
              <p className="text-gray-600">NIC: {user.nic}</p>
              <p className="text-gray-500 text-xs">{user.mobile}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default IDCardUserList;
