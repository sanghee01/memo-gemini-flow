
import React, { useState } from 'react';
import { Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MemoCategorySelectorProps {
  selectedCategory?: string;
  availableCategories: string[];
  onChange: (category?: string) => void;
}

export const MemoCategorySelector: React.FC<MemoCategorySelectorProps> = ({
  selectedCategory,
  availableCategories,
  onChange
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleAddNew = () => {
    if (newCategory.trim()) {
      onChange(newCategory.trim());
      setNewCategory('');
      setIsAddingNew(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">카테고리:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-1">
            <Tag className="w-4 h-4" />
            <span>{selectedCategory || '선택'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {availableCategories.map((category) => (
            <DropdownMenuItem
              key={category}
              onClick={() => onChange(category)}
              className={selectedCategory === category ? 'bg-blue-50' : ''}
            >
              {category}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => setIsAddingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            새 카테고리 추가
          </DropdownMenuItem>
          {selectedCategory && (
            <DropdownMenuItem onClick={() => onChange(undefined)}>
              카테고리 제거
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {isAddingNew && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder="새 카테고리명"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddNew()}
            className="w-32"
          />
          <Button size="sm" onClick={handleAddNew}>
            추가
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsAddingNew(false)}>
            취소
          </Button>
        </div>
      )}
    </div>
  );
};
