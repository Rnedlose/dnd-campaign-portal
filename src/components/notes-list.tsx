'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreVertical, EyeOff, ArrowUpDown, Search, X } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  gmOnly: boolean;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface NotesListProps {
  campaignId: string;
  onRefresh?: () => void;
  showSearch?: boolean;
  onShowSearchChange?: (show: boolean) => void;
}

export function NotesList({
  campaignId,
  onRefresh,
  showSearch = false,
  onShowSearchChange,
}: NotesListProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isGM, setIsGM] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Note>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
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

  useEffect(() => {
    fetchNotes();
  }, [campaignId]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/notes/${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data);
    } catch {
      showToast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes/${campaignId}/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');
      showToast.success('Note deleted successfully');
      fetchNotes();
      onRefresh?.();
    } catch {
      showToast.error('Failed to delete note');
    }
  };

  const handleToggleGMOnly = async (noteId: string, currentGmOnly: boolean) => {
    try {
      const response = await fetch(`/api/notes/${campaignId}/${noteId}/gm-only`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmOnly: !currentGmOnly }),
      });

      if (!response.ok) throw new Error('Failed to update note visibility');
      showToast.success(`Note is now ${!currentGmOnly ? 'GM only' : 'visible to all'}`);
      fetchNotes();
      onRefresh?.();
    } catch {
      showToast.error('Failed to update note visibility');
    }
  };

  const handleSort = (field: keyof Note) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewNote = (noteId: string) => {
    window.open(`/campaigns/${campaignId}/notes/${noteId}`, '_blank');
  };

  const filteredAndSortedNotes = notes
    .filter((note) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortDirection === 'asc' ? 1 : -1;

      if (sortField === 'gmOnly') {
        return (Number(a.gmOnly) - Number(b.gmOnly)) * modifier;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedNotes.length / ITEMS_PER_PAGE);
  const paginatedNotes = filteredAndSortedNotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (loading) return <div>Loading notes...</div>;

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative flex-1 mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-8"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7 w-7 p-0"
            onClick={() => {
              setSearchTerm('');
              onShowSearchChange?.(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">
              <Button
                variant="ghost"
                onClick={() => handleSort('title')}
                className="flex items-center gap-1"
              >
                Title
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[200px]">
              <Button
                variant="ghost"
                onClick={() => handleSort('updatedAt')}
                className="flex items-center gap-1"
              >
                Last Updated
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            {isGM && (
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('gmOnly')}
                  className="flex items-center gap-1"
                >
                  Visibility
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
            )}
            {isGM && <TableHead className="text-right w-[120px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedNotes.map((note) => (
            <TableRow key={note.id}>
              <TableCell>
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={() => handleViewNote(note.id)}
                >
                  {note.title}
                </Button>
              </TableCell>
              <TableCell>{new Date(note.updatedAt).toLocaleString()}</TableCell>
              {isGM && (
                <TableCell className="text-muted-foreground">
                  {note.gmOnly ? (
                    <span className="text-xs text-red-500">GM Only</span>
                  ) : (
                    <span className="text-xs text-green-500">All Players</span>
                  )}
                </TableCell>
              )}
              {isGM && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/campaigns/${campaignId}/notes/${note.id}/edit`)
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleGMOnly(note.id, note.gmOnly)}>
                        <EyeOff className="h-4 w-4 mr-2" />
                        {note.gmOnly ? 'Make Visible to All' : 'Make GM Only'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(note.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
