
import React, { useState } from 'react';
import { Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MemoReminderSelectorProps {
  reminderDate?: Date;
  onChange: (date?: Date) => void;
}

export const MemoReminderSelector: React.FC<MemoReminderSelectorProps> = ({
  reminderDate,
  onChange
}) => {
  const [open, setOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const handleQuickReminder = (hours: number) => {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    onChange(reminderTime);
    setOpen(false);
  };

  const handleCustomReminder = () => {
    if (customDate) {
      const date = new Date(customDate);
      if (date > new Date()) {
        onChange(date);
        setOpen(false);
      }
    }
  };

  const handleRemoveReminder = () => {
    onChange(undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-1">
          <Bell className={`w-4 h-4 ${reminderDate ? 'text-blue-500' : ''}`} />
          <span>{reminderDate ? '알림 설정됨' : '알림 설정'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>메모 알림 설정</span>
          </DialogTitle>
          <DialogDescription>
            언제 이 메모를 다시 알림받고 싶으신가요?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handleQuickReminder(1)}>
              1시간 뒤
            </Button>
            <Button variant="outline" onClick={() => handleQuickReminder(24)}>
              하루 뒤
            </Button>
            <Button variant="outline" onClick={() => handleQuickReminder(48)}>
              이틀 뒤
            </Button>
            <Button variant="outline" onClick={() => handleQuickReminder(168)}>
              일주일 뒤
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">직접 설정</label>
            <Input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <Button onClick={handleCustomReminder} className="w-full">
              설정
            </Button>
          </div>
          
          {reminderDate && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                현재 알림: {reminderDate.toLocaleString('ko-KR')}
              </p>
              <Button variant="destructive" onClick={handleRemoveReminder} className="w-full">
                알림 제거
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
