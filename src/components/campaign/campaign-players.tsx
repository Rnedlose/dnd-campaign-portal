'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';

interface CampaignPlayer {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

interface CampaignPlayersProps {
  campaignId: string;
}

export function CampaignPlayers({ campaignId }: CampaignPlayersProps) {
  const { data: session } = useSession();
  const [players, setPlayers] = useState<CampaignPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/players`);
        if (!response.ok) throw new Error('Failed to fetch players');
        const data = await response.json();
        setPlayers(data);
      } catch {
        toast.error('Failed to load players');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [campaignId]);

  const handleViewProfile = (userId: string) => {
    window.open(`/profile/${userId}`, '_blank');
  };

  // Remove the filtering of current user
  const allPlayers = players;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>Loading players...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (allPlayers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>No players in this campaign yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <CardContent>
      <div className="space-y-4">
        {allPlayers.map((player) => (
          <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={player.image || undefined} />
                <AvatarFallback>
                  {player.name?.charAt(0) || player.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{player.name || 'Unnamed Player'}</p>
                  <Badge variant={player.role === 'GM' ? 'default' : 'secondary'}>
                    {player.role}
                  </Badge>
                  {player.id === session?.user?.id && <Badge variant="outline">You</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{player.email}</p>
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
                <DropdownMenuItem onClick={() => handleViewProfile(player.id)}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </CardContent>
  );
}
