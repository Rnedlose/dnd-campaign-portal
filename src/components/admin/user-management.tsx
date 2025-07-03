'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { UserPlus, UserMinus, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
}

export function UserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update user role');

      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to delete user');

      setUsers(users.filter((user) => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (session?.user?.role !== 'admin') return <div>Access denied</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Name</TableHead>
          <TableHead className="w-[400px]">Email</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-muted-foreground max-w-[300px] whitespace-normal">
              {user.email}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {user.role === 'user' ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateUserRole(user.id, 'admin')}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateUserRole(user.id, 'user')}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={() => deleteUser(user.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
