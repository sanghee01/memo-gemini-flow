
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Key, AlertCircle } from 'lucide-react';

interface GeminiKeyDialogProps {
  open: boolean;
  onApiKeySubmit: (key: string) => void;
}

export const GeminiKeyDialog: React.FC<GeminiKeyDialogProps> = ({ open, onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API 키를 입력해주세요.');
      return;
    }
    if (!apiKey.startsWith('AIza')) {
      setError('올바른 Gemini API 키 형식이 아닙니다.');
      return;
    }
    onApiKeySubmit(apiKey.trim());
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span>Gemini API 키 설정</span>
          </DialogTitle>
          <DialogDescription>
            메모 정리 기능을 사용하기 위해 Google Gemini API 키를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API 키</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>API 키 획득 방법:</strong><br />
              1. Google AI Studio(aistudio.google.com) 방문<br />
              2. 'Get API key' 클릭<br />
              3. 새 프로젝트 생성 또는 기존 프로젝트 선택<br />
              4. API 키 생성 및 복사
            </p>
          </div>
          
          <Button type="submit" className="w-full">
            API 키 저장하고 시작하기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
