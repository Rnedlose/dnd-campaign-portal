'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signOut } from 'next-auth/react';
import { showToast } from '@/lib/toast';
import { ProtectedRoute } from '@/components/protected-route';
import { UserManagement } from '@/components/admin/user-management';
import { PlusIcon, ExternalLinkIcon, Trash2Icon, Sun, Moon, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  role: string;
}

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [createdCampaigns, setCreatedCampaigns] = useState<Campaign[]>([]);
  const [joinedCampaigns, setJoinedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
      setCreatedCampaigns(createdCampaigns.filter((campaign) => campaign.id !== campaignId));
      showToast.success('Campaign deleted successfully');
    } catch {
      showToast.error('Failed to delete campaign');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCreatedCampaigns(data.createdCampaigns);
      setJoinedCampaigns(data.joinedCampaigns);
    } catch {
      showToast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      showToast.success('Successfully signed out!');
    } catch {
      showToast.error('Failed to sign out');
    }
  };

  const handleCreateCampaign = () => {
    router.push('/campaigns/new');
  };

  const handleToggleTheme = async () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // Persist to DB
    try {
      await fetch('/api/user/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch {}
  };

  // Use a type assertion for session.user
  const user = session?.user as SessionUser | undefined;

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        {/* Header with integrated welcome message and user menu */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.name} • {user?.role || 'Player'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="User menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleTheme}>
                  {resolvedTheme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${session?.user?.id}`}>
                    <User className="h-4 w-4 mr-2" />
                    Update Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        )}

        {/* Campaign Management */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Campaign Management</CardTitle>
            <Button onClick={handleCreateCampaign} variant="outline" size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[400px]">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Loading campaigns...
                    </TableCell>
                  </TableRow>
                ) : createdCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      You haven&apos;t created any campaigns yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  createdCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] whitespace-normal">
                        {campaign.description || 'No description'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            <ExternalLinkIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Joined Campaigns */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Joined Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[400px]">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Loading campaigns...
                    </TableCell>
                  </TableRow>
                ) : joinedCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      You haven&apos;t joined any campaigns yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  joinedCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] whitespace-normal">
                        {campaign.description || 'No description'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
