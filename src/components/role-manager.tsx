'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, User, Crown, UserX } from 'lucide-react';
import { showToast } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';

interface RoleManagerProps {
  campaignId: string;
}

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function AddPlayerButton({ campaignId }: { campaignId: string }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      showToast.success('Player added successfully');
      setEmail('');
      setInviteOpen(false);
      // Trigger a refresh of the role manager
      window.dispatchEvent(new CustomEvent('refreshMembers'));
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'Failed to add player');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Player</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Player to Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Player Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Player'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RoleManager({ campaignId }: RoleManagerProps) {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/members`);
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        setMembers(data);
      } catch (error: unknown) {
        console.error('Error fetching members:', error);
        showToast.error('Error loading members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();

    // Listen for refresh events
    const handleRefresh = () => {
      fetchMembers();
    };
    window.addEventListener('refreshMembers', handleRefresh);
    return () => {
      window.removeEventListener('refreshMembers', handleRefresh);
    };
  }, [campaignId]);

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      showToast.success('Role updated successfully');
      // Trigger a refresh of the members list
      window.dispatchEvent(new CustomEvent('refreshMembers'));
    } catch (error: unknown) {
      console.error('Error updating role:', error);
      showToast.error('Error updating role');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove member');
      showToast.success('Member removed successfully');
      // Trigger a refresh of the members list
      window.dispatchEvent(new CustomEvent('refreshMembers'));
    } catch (error: unknown) {
      console.error('Error removing member:', error);
      showToast.error('Error removing member');
    }
  };

  const handleViewProfile = (member: Member) => {
    window.open(`/profile/${member.user.id}`, '_blank');
  };

  if (isLoading) {
    return <div>Loading members...</div>;
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={member.user.image || undefined} />
              <AvatarFallback>
                {member.user.name?.charAt(0) || member.user.email?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium">{member.user.name || 'Unnamed Player'}</p>
                <Badge variant={member.role === 'GM' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
                {member.user.id === session?.user?.id && <Badge variant="outline">You</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              {member.role !== 'GM' && (
                <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'GM')}>
                  <Crown className="mr-2 h-4 w-4" />
                  Make GM
                </DropdownMenuItem>
              )}
              {member.user.id !== session?.user?.id && (
                <DropdownMenuItem onClick={() => removeMember(member.id)} className="text-red-600">
                  <UserX className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
