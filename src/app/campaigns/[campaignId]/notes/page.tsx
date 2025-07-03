'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlockNoteEditor } from '@/components/block-note-editor';
import { ArrowLeftIcon } from 'lucide-react';

export default function CampaignNotesPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/campaigns/${campaignId}`)}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Campaign Notes</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notes Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockNoteEditor campaignId={campaignId} />
        </CardContent>
      </Card>
    </div>
  );
}
