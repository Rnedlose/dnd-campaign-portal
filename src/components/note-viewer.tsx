'use client';

import { Block } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { useTheme } from 'next-themes';

// Import BlockNote styles
import '@blocknote/core/style.css';
import '@blocknote/mantine/style.css';

interface NoteViewerProps {
  content: string;
}

export function NoteViewer({ content }: NoteViewerProps) {
  const { resolvedTheme } = useTheme();

  const editor = useCreateBlockNote({
    initialContent: content ? (JSON.parse(content) as Block[]) : undefined,
    domAttributes: {
      editor: {
        class: 'bg-background',
      },
    },
  });

  return (
    <div className="bg-background [&_*]:!bg-background dark:[&_*]:!text-white">
      <BlockNoteView editor={editor} editable={false} theme="light" />
    </div>
  );
}
