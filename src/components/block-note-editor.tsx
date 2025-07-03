'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { showToast } from '@/lib/toast';
import { Block } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

// Import BlockNote styles
import '@blocknote/core/style.css';
import '@blocknote/mantine/style.css';

interface BlockNoteEditorProps {
  campaignId: string;
  noteId?: string;
  initialNote?: {
    title: string;
    content: string;
    gmOnly: boolean;
  };
  onSave?: () => void;
}

export function BlockNoteEditor({ campaignId, noteId, initialNote, onSave }: BlockNoteEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = React.useState(initialNote?.title || '');
  const [isGM, setIsGM] = React.useState(false);
  const [gmOnly, setGmOnly] = React.useState(initialNote?.gmOnly || false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Create editor instance with proper configuration
  const editor = useCreateBlockNote({
    initialContent: initialNote?.content ? JSON.parse(initialNote.content) : undefined,
    domAttributes: {
      editor: {
        class: 'min-h-[500px] w-full h-full',
      },
    },
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/role`);
        if (response.ok) {
          const data = await response.json();
          setIsGM(data.role === 'GM');
        }
      } catch {
        console.error('Failed to fetch user role');
      }
    };

    if (session?.user) {
      fetchUserRole();
    }
  }, [campaignId, session?.user]);

  React.useEffect(() => {
    if (noteId && !initialNote) {
      const fetchNote = async () => {
        try {
          const response = await fetch(`/api/notes/${campaignId}/${noteId}`);
          if (response.ok) {
            const note = await response.json();
            setTitle(note.title);
            setGmOnly(note.gmOnly);
            if (note.content) {
              const blocks = JSON.parse(note.content) as Block[];
              editor.replaceBlocks(editor.topLevelBlocks, blocks);
            }
          }
        } catch (error) {
          console.error('Failed to fetch note:', error);
          showToast.error('Failed to load note');
        }
      };
      fetchNote();
    }
  }, [noteId, campaignId, initialNote, editor]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast.error('Title is required');
      return;
    }

    const blocks = editor.topLevelBlocks;
    if (!blocks || blocks.length === 0) {
      showToast.error('Content is required');
      return;
    }

    setIsLoading(true);
    try {
      const method = noteId ? 'PATCH' : 'POST';
      const url = noteId ? `/api/notes/${campaignId}/${noteId}` : `/api/notes/${campaignId}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: JSON.stringify(blocks),
          gmOnly,
        }),
      });

      if (!response.ok) throw new Error('Failed to save note');

      showToast.success('Note saved successfully');
      onSave?.();
      router.push(`/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Error saving note:', error);
      showToast.error('Failed to save note');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div className="h-[500px] bg-gray-100 animate-pulse rounded-lg" />;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="title">Title</Label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter note title..."
        />
      </div>

      {isGM && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="gmOnly"
            checked={gmOnly}
            onChange={(e) => setGmOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="gmOnly">GM Only</Label>
        </div>
      )}

      <div className="flex-1 border rounded-lg overflow-hidden bg-white">
        <BlockNoteView
          editor={editor}
          theme="light"
          editable={true}
          className="h-full min-h-[500px] overflow-y-auto"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
    </div>
  );
}
