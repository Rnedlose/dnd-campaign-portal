import * as React from 'react';
import { MoreVertical, Edit, Eye, Trash2, Lock, Unlock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RadialMenuProps {
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  onToggleGMOnly?: () => void;
  isGMOnly?: boolean;
  showGMToggle?: boolean;
  isGM?: boolean;
}

export function RadialMenu({
  onEdit,
  onView,
  onDelete,
  onToggleGMOnly,
  isGMOnly,
  showGMToggle,
  isGM,
}: RadialMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        {isGM && (
          <>
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {showGMToggle && (
              <DropdownMenuItem onClick={onToggleGMOnly} className="cursor-pointer">
                {isGMOnly ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    GM Only
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Make GM Only
                  </>
                )}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
