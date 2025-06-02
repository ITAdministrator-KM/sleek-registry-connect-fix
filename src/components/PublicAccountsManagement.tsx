import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PublicUserPasswordForm } from './forms/PublicUserPasswordForm';
import { apiService, type PublicUser } from '@/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PublicAccountsManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await apiService.getPublicUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch public users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      setIsLoading(true);
      const newUser = await apiService.createPublicUser(userData);
      setUsers(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [newUser, ...safePrev];
      });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Public user created successfully",
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create public user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: PublicUser) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setIsLoading(true);
      await apiService.deletePublicUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      toast({
        title: "Success",
        description: "Public user deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete public user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = (user: PublicUser) => {
    setSelectedUser(user);
    setShowPasswordForm(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Public Users Management</h2>
        <Button onClick={() => setShowForm(true)}>Create New User</Button>
      </div>

      {showPasswordForm && selectedUser && (
        <Dialog open={showPasswordForm} onOpenChange={setShowPasswordForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Password for {selectedUser.name}</DialogTitle>
              <DialogDescription>
                Enter a new password for this user.
              </DialogDescription>
            </DialogHeader>
            <PublicUserPasswordForm
              userId={selectedUser.id}
              isStaffUpdate={true}
              onSuccess={() => setShowPasswordForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Public ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>NIC</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Division</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.public_id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.nic}</TableCell>
                <TableCell>{user.mobile}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.department_name || '-'}</TableCell>
                <TableCell>{user.division_name || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePasswordUpdate(user)}
                  >
                    Set Password
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
