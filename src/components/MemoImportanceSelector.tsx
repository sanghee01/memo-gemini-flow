
import React from 'react';
import { Star, AlertCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MemoImportanceSelectorProps {
  importance: 'low' | 'medium' | 'high';
  onChange: (importance: 'low' | 'medium' | 'high') => void;
}

export const MemoImportanceSelector: React.FC<MemoImportanceSelectorProps> = ({
  importance,
  onChange
}) => {
  const importanceOptions = [
    { value: 'low' as const, label: '낮음', icon: Circle, color: 'text-gray-400' },
    { value: 'medium' as const, label: '보통', icon: AlertCircle, color: 'text-yellow-500' },
    { value: 'high' as const, label: '높음', icon: Star, color: 'text-red-500' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">중요도:</span>
      {importanceOptions.map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.value}
            variant={importance === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value)}
            className="flex items-center space-x-1"
          >
            <Icon className={`w-4 h-4 ${option.color}`} />
            <span>{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
