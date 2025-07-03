'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Chat } from '@/components/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomProvider } from '@/lib/liveblocks';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ImagePlus } from 'lucide-react';
import { useState, useEffect } from 'react';

const Whiteboard = dynamic(() => import('@/components/Whiteboard'), { ssr: false });

interface Campaign {
  id: string;
  name: string;
  role: 'GM' | 'Player';
}

export default function VTTPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const [openFilePicker, setOpenFilePicker] = useState<null | (() => void)>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error('Failed to fetch campaign');
        const data = await response.json();
        setCampaign(data);
      } catch {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [campaignId]);

  if (loading) return <div>Loading...</div>;
  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="flex h-screen">
      {/* Whiteboard section - takes up most of the space */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Virtual Tabletop</CardTitle>
            <div className="flex items-center gap-2">
              {campaign.role === 'GM' && (
                <Button
                  variant="outline"
                  onClick={() => openFilePicker && openFilePicker()}
                  aria-label="Insert Campaign Image"
                  className="flex items-center justify-center"
                  style={{ minWidth: 48, minHeight: 48 }}
                >
                  <ImagePlus className="h-5 w-5 mr-2" />
                  Campaign Images
                </Button>
              )}
              <Link href={`/campaigns/${campaignId}`}>
                <Button variant="outline">Back to Campaign</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-4rem)]">
            <RoomProvider 
              id={`whiteboard-${campaignId}`}
              initialPresence={{
                color: "#000000",
                name: "Anonymous"
              }}
            >
              <Whiteboard 
                campaignId={campaignId} 
                setOpenFilePicker={setOpenFilePicker}
              />
            </RoomProvider>
          </CardContent>
        </Card>
      </div>
      
      {/* Chat section - fixed width on the right */}
      <div className="w-96 p-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Campaign Chat</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-4rem)]">
            <Chat campaignId={campaignId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
