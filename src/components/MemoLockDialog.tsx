
import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MemoLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLocked: boolean;
  onLock: (password: string) => void;
  onUnlock: (password: string) => boolean;
}

export const MemoLockDialog: React.FC<MemoLockDialogProps> = ({
  open,
  onOpenChange,
  isLocked,
  onLock,
  onUnlock
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    if (isLocked) {
      const success = onUnlock(password);
      if (!success) {
        setError('비밀번호가 올바르지 않습니다.');
        return;
      }
    } else {
      onLock(password);
    }
    
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            <span>{isLocked ? '메모 잠금 해제' : '메모 잠금 설정'}</span>
          </DialogTitle>
          <DialogDescription>
            {isLocked 
              ? '메모 잠금을 해제하려면 비밀번호를 입력하세요.'
              : '메모를 잠그려면 비밀번호를 설정하세요.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit}>
            {isLocked ? '잠금 해제' : '잠금 설정'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
