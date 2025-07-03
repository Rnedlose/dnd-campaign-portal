'use client';

import { RoomProvider } from "@/lib/liveblocks";
import Whiteboard from "@/components/Whiteboard";
import { useParams } from "next/navigation";

export default function WhiteboardPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  return (
    <RoomProvider 
      id={`whiteboard-${campaignId}`}
      initialPresence={{
        color: "#000000",
        name: "Anonymous"
      }}
    >
      <Whiteboard campaignId={campaignId} />
    </RoomProvider>
  );
} 