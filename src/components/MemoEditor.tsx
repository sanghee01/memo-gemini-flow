
import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Image, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Memo } from '@/types/memo';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from '@/components/ui/use-toast';

interface MemoEditorProps {
  memo: Memo;
  onSave: (memo: Memo) => void;
  onCancel: () => void;
}

export const MemoEditor: React.FC<MemoEditorProps> = ({ memo, onSave, onCancel }) => {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, handleImageUpload, handleImagePaste } = useImageUpload();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const imageData = await handleImagePaste(e);
      if (imageData) {
        const cursorPosition = textarea.selectionStart;
        const textBefore = content.substring(0, cursorPosition);
        const textAfter = content.substring(cursorPosition);
        const imageMarkdown = `\n![이미지](${imageData})\n`;
        setContent(textBefore + imageMarkdown + textAfter);
        toast({
          title: "이미지 추가됨",
          description: "이미지가 메모에 추가되었습니다."
        });
      }
    };

    textarea.addEventListener('paste', handlePaste);
    return () => textarea.removeEventListener('paste', handlePaste);
  }, [content, handleImagePaste]);

  const handleSave = () => {
    const updatedMemo: Memo = {
      ...memo,
      title: title.trim() || '제목 없음',
      content,
      updatedAt: new Date()
    };
    onSave(updatedMemo);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "오류",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "destructive"
      });
      return;
    }

    try {
      const imageData = await handleImageUpload(file);
      const imageMarkdown = `\n![${file.name}](${imageData})\n`;
      setContent(prev => prev + imageMarkdown);
      toast({
        title: "이미지 업로드 완료",
        description: `${file.name}이 메모에 추가되었습니다.`
      });
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">메모 편집</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Upload className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
            이미지
          </Button>
          <Button onClick={handleSave} size="sm">
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
          <Button variant="outline" onClick={onCancel} size="sm">
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      <div className="space-y-4">
        <div>
          <Input
            placeholder="메모 제목을 입력하세요..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium"
          />
        </div>
        
        <div>
          <Textarea
            ref={textareaRef}
            placeholder="여기에 메모를 자유롭게 작성하세요...&#10;&#10;💡 팁: 이미지를 복사(Ctrl+C)한 후 여기에 붙여넣기(Ctrl+V)할 수 있습니다!"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] resize-none text-base leading-relaxed"
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        마지막 수정: {memo.updatedAt.toLocaleString('ko-KR')}
      </div>
    </div>
  );
};
