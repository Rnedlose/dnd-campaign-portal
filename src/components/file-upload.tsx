'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';
import { MoreVertical, Trash2, Edit, EyeOff, ArrowUpDown, Search, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useUploadThing } from '@/lib/uploadthing-client';

interface CampaignFile {
  id: string;
  name: string;
  url: string;
  gmOnly: boolean;
}

const MAX_FILE_SIZES = {
  image: 16 * 1024 * 1024, // 16MB
  pdf: 64 * 1024 * 1024, // 64MB
  text: 4 * 1024 * 1024, // 4MB
};

const ITEMS_PER_PAGE = 5;

export function FileUpload({
  campaignId,
  refreshFiles,
  showSearch,
  onShowSearchChange,
}: {
  campaignId: string;
  refreshFiles: () => void;
  showSearch: boolean;
  onShowSearchChange: (show: boolean) => void;
}) {
  const { data: session } = useSession();
  const [files, setFiles] = useState<CampaignFile[]>([]);
  const [isGM, setIsGM] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ id: string; name: string } | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CampaignFile;
    direction: 'asc' | 'desc';
  }>({
    key: 'name',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { startUpload, isUploading } = useUploadThing('campaignFile', {
    onClientUploadComplete: async (res) => {
      if (res?.[0]) {
        try {
          // Save file metadata to database
          const response = await fetch('/api/files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              campaignId,
              name: res[0].name,
              url: res[0].url,
              type: res[0].type,
              size: res[0].size,
              gmOnly: false,
            }),
          });

          if (response.status === 409) {
            showToast.error('A file with this name already exists in this campaign.');
            return;
          }
          if (!response.ok) throw new Error('Failed to save file metadata');

          showToast.success('File uploaded successfully');
          refreshFiles();
        } catch (error) {
          console.error('Error saving file metadata:', error);
          showToast.error('Failed to save file metadata');
        }
      }
    },
    onUploadError: (error: Error) => {
      console.error('Upload error:', error);
      if (error.message.includes('FileSizeMismatch')) {
        showToast.error('File is too large. Maximum sizes: Images (16MB), PDFs (64MB), Text (4MB)');
      } else {
        showToast.error(`Error uploading file: ${error.message}`);
      }
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File type:', file.type);
    console.log('File name:', file.name);

    // Determine file type based on MIME type
    let fileType = 'text';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type === 'application/pdf') {
      fileType = 'pdf';
    }

    console.log('Determined file type:', fileType);
    const maxSize = MAX_FILE_SIZES[fileType as keyof typeof MAX_FILE_SIZES];

    if (file.size > maxSize) {
      showToast.error(
        `File is too large. Maximum size for ${fileType} files is ${maxSize / (1024 * 1024)}MB`,
      );
      return;
    }

    await startUpload([file]);
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

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
    fetch(`/api/files/${campaignId}`)
      .then((res) => res.json())
      .then((data) => {
        // Filter files based on user role
        const filteredFiles = isGM ? data : data.filter((file: CampaignFile) => !file.gmOnly);
        setFiles(filteredFiles);
      });
  }, [campaignId, refreshFiles, isGM]);

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${campaignId}/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete file');

      showToast.success('File deleted successfully');
      refreshFiles();
    } catch {
      showToast.error('Failed to delete file');
    }
  };

  const handleFileRename = async (fileId: string, newName: string) => {
    try {
      const response = await fetch(`/api/files/${campaignId}/${fileId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error('Failed to rename file');

      showToast.success('File renamed successfully');
      refreshFiles();
      setRenameDialogOpen(false);
    } catch {
      showToast.error('Failed to rename file');
    }
  };

  const handleToggleGMOnly = async (fileId: string, currentGmOnly: boolean) => {
    try {
      const response = await fetch(`/api/files/${campaignId}/${fileId}/gm-only`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gmOnly: !currentGmOnly }),
      });

      if (!response.ok) throw new Error('Failed to update file visibility');

      showToast.success(`File is now ${!currentGmOnly ? 'GM only' : 'visible to all'}`);
      refreshFiles();
    } catch {
      showToast.error('Failed to update file visibility');
    }
  };

  const handleSort = (key: keyof CampaignFile) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredAndSortedFiles = files
    .filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      }
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    });

  const totalPages = Math.ceil(filteredAndSortedFiles.length / ITEMS_PER_PAGE);
  const paginatedFiles = filteredAndSortedFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      <input
        id="file-upload-input"
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,.md,.doc,.docx"
        disabled={isUploading}
      />

      {showSearch && (
        <div className="relative flex-1 mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7 w-7 p-0"
            onClick={() => {
              setSearchQuery('');
              onShowSearchChange(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {files.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1"
                  >
                    Name
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
              {paginatedFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate block max-w-[220px]"
                    >
                      {file.name}
                    </a>
                  </TableCell>
                  {isGM && (
                    <TableCell className="text-muted-foreground">
                      {file.gmOnly ? (
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
                            onClick={() => {
                              setSelectedFile(file);
                              setNewFileName(file.name);
                              setRenameDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleGMOnly(file.id, file.gmOnly)}
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            {file.gmOnly ? 'Make Visible to All' : 'Make GM Only'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleFileDelete(file.id)}
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
        </>
      )}

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newFileName">New File Name</Label>
              <Input
                id="newFileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedFile && handleFileRename(selectedFile.id, newFileName)}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
