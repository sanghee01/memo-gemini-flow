
import React from 'react';
import { Button } from '@/components/ui/button';

interface MemoColorSelectorProps {
  selectedColor?: string;
  onChange: (color: string) => void;
}

export const MemoColorSelector: React.FC<MemoColorSelectorProps> = ({
  selectedColor,
  onChange
}) => {
  const colors = [
    { name: '기본', value: '', bg: 'bg-white', border: 'border-gray-200' },
    { name: '빨강', value: 'red', bg: 'bg-red-50', border: 'border-red-200' },
    { name: '주황', value: 'orange', bg: 'bg-orange-50', border: 'border-orange-200' },
    { name: '노랑', value: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { name: '초록', value: 'green', bg: 'bg-green-50', border: 'border-green-200' },
    { name: '파랑', value: 'blue', bg: 'bg-blue-50', border: 'border-blue-200' },
    { name: '보라', value: 'purple', bg: 'bg-purple-50', border: 'border-purple-200' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">컬러:</span>
      <div className="flex space-x-1">
        {colors.map((color) => (
          <Button
            key={color.value}
            variant="outline"
            size="sm"
            onClick={() => onChange(color.value)}
            className={`w-8 h-8 p-0 ${color.bg} ${color.border} ${
              selectedColor === color.value ? 'ring-2 ring-blue-500' : ''
            }`}
            title={color.name}
          >
            {selectedColor === color.value && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
