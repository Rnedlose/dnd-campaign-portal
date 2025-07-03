'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Chat } from '@/components/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomProvider } from '@/lib/liveblocks';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const Whiteboard = dynamic(() => import('@/components/Whiteboard'), { ssr: false });

export default function VTTPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  return (
    <div className="flex h-screen">
      {/* Whiteboard section - takes up most of the space */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Virtual Tabletop</CardTitle>
            <Link href={`/campaigns/${campaignId}`}>
              <Button variant="outline">Back to Campaign</Button>
            </Link>
          </CardHeader>
          <CardContent className="h-[calc(100%-4rem)]">
            <RoomProvider 
              id={`whiteboard-${campaignId}`}
              initialPresence={{
                color: "#000000",
                name: "Anonymous"
              }}
            >
              <Whiteboard campaignId={campaignId} />
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
