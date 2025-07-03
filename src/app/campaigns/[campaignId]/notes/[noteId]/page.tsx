'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { ProtectedRoute } from '@/components/protected-route';
import dynamic from 'next/dynamic';

const NoteViewer = dynamic(() => import('@/components/note-viewer').then((mod) => mod.NoteViewer), {
  ssr: false,
});

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/notes/${params.campaignId}/${params.noteId}`);
        if (!response.ok) throw new Error('Failed to fetch note');
        const data = await response.json();
        setNote(data);
      } catch (error) {
        showToast.error('Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [params.campaignId, params.noteId]);

  if (loading) return <div>Loading note...</div>;
  if (!note) return <div>Note not found</div>;

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/campaigns/${params.campaignId}`)}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{note.title}</h1>
            <p className="text-sm text-muted-foreground">
              Created by {note.createdBy.name} • Last updated{' '}
              {new Date(note.updatedAt).toLocaleString()}
              {note.gmOnly && <span className="ml-2 text-red-500">(GM Only)</span>}
            </p>
          </div>
        </div>

        <Card className="h-[calc(100vh-300px)] bg-background">
          <CardHeader></CardHeader>
          <CardContent className="h-[calc(100%-5rem)]">
            <div className="prose dark:prose-invert max-w-none h-full">
              <NoteViewer content={note.content} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
