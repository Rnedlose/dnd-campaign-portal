import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface CampaignFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface TldrawFilePickerProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: CampaignFile) => void;
}

export function TldrawFilePicker({ campaignId, isOpen, onClose, onSelect }: TldrawFilePickerProps) {
  const [files, setFiles] = useState<CampaignFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/files/${campaignId}`)
        .then((res) => res.json())
        .then((data) => {
          // Only show image files
          const imageFiles = data.filter((file: CampaignFile) => 
            file.type.startsWith('image/')
          );
          setFiles(imageFiles);
        });
    }
  }, [campaignId, isOpen]);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl z-[9999]">
        <DialogHeader>
          <DialogTitle>Select Campaign Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow
                    key={file.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      onSelect(file);
                      onClose();
                    }}
                  >
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>{file.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 