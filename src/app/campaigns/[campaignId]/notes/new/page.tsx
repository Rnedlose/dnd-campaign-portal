'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlockNoteEditor } from '@/components/block-note-editor';
import { ProtectedRoute } from '@/components/protected-route';

export default function NewNotePage() {
  const params = useParams();
  const router = useRouter();

  const handleSave = () => {
    router.push(`/campaigns/${params.campaignId}`);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10 min-h-screen">
        <Card className="h-[calc(100vh-120px)]">
          <CardHeader>
            <CardTitle>Create New Note</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)] overflow-hidden">
            <BlockNoteEditor campaignId={params.campaignId as string} onSave={handleSave} />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
