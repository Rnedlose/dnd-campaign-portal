'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ArrowLeftIcon, MessageSquare } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { ProtectedRoute } from '@/components/protected-route';
import { FileUpload } from '@/components/file-upload';
import { NotesList } from '@/components/notes-list';
import { RoleManager, AddPlayerButton } from '@/components/role-manager';

interface Campaign {
  id: string;
  name: string;
  role: 'GM' | 'Player';
}

export default function CampaignDashboard() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [showFileSearch, setShowFileSearch] = useState(false);
  const [showNoteSearch, setShowNoteSearch] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const campaignId = await params.campaignId;
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error('Failed to fetch campaign');
        const data = await response.json();
        setCampaign(data);
      } catch {
        showToast.error('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [params.campaignId]);

  const fetchFiles = useCallback(() => setFileRefreshKey((k) => k + 1), []);

  if (loading) return <div>Loading...</div>;
  if (!campaign) return <div>Campaign not found</div>;

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open(`/campaigns/${campaign.id}/vtt`, '_blank')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Virtual Tabletop
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Campaign Players</CardTitle>
            {campaign.role === 'GM' && <AddPlayerButton campaignId={campaign.id} />}
          </CardHeader>
          <CardContent>
            <RoleManager campaignId={campaign.id} />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Files</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileSearch(true)}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              {campaign.role === 'GM' && (
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  Upload
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <FileUpload
              campaignId={campaign.id}
              refreshFiles={fetchFiles}
              key={fileRefreshKey}
              showSearch={showFileSearch}
              onShowSearchChange={setShowFileSearch}
            />
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notes</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNoteSearch(true)}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              {campaign.role === 'GM' && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/campaigns/${campaign.id}/notes/new`)}
                >
                  Create Note
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <NotesList
              campaignId={campaign.id}
              showSearch={showNoteSearch}
              onShowSearchChange={setShowNoteSearch}
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
