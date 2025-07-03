'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { showToast } from '@/lib/toast';
import { ProtectedRoute } from '@/components/protected-route';
import { UserManagement } from '@/components/admin/user-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  role: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [createdCampaigns, setCreatedCampaigns] = useState<Campaign[]>([]);
  const [joinedCampaigns, setJoinedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCreatedCampaigns(data.createdCampaigns);
      setJoinedCampaigns(data.joinedCampaigns);
    } catch (error) {
      showToast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      showToast.success('Successfully signed out!');
    } catch (error) {
      showToast.error('Failed to sign out');
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl mb-4">Welcome, {session?.user?.name}!</h2>
          <p>Your role: {session?.user?.role || 'Player'}</p>
        </div>

        {session?.user?.role === 'admin' && <UserManagement />}

        <div className="space-y-8">
          {/* Create Campaign Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Campaign</h2>
              <Button asChild>
                <Link href="/campaigns/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Campaign
                </Link>
              </Button>
            </div>
          </section>

          {/* Created Campaigns Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Your Campaigns</h2>
            {loading ? (
              <div>Loading...</div>
            ) : createdCampaigns.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {createdCampaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription>{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild>
                        <Link href={`/campaigns/${campaign.id}`}>Open Campaign</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You haven't created any campaigns yet.</p>
            )}
          </section>

          {/* Joined Campaigns Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Joined Campaigns</h2>
            {loading ? (
              <div>Loading...</div>
            ) : joinedCampaigns.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {joinedCampaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription>{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild>
                        <Link href={`/campaigns/${campaign.id}`}>Open Campaign</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You haven't joined any campaigns yet.</p>
            )}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
