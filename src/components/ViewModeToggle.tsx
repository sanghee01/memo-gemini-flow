
import React from 'react';
import { List, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types/memo';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="flex items-center space-x-1"
      >
        <List className="w-4 h-4" />
        <span>리스트</span>
      </Button>
      <Button
        variant={viewMode === 'gallery' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('gallery')}
        className="flex items-center space-x-1"
      >
        <Grid className="w-4 h-4" />
        <span>갤러리</span>
      </Button>
    </div>
  );
};
