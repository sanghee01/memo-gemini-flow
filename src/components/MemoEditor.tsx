import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  X,
  Image,
  Upload,
  Lock,
  Unlock,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Memo } from "@/types/memo";
import { useImageUpload } from "@/hooks/useImageUpload";
import { MemoImportanceSelector } from "./MemoImportanceSelector";
import { MemoColorSelector } from "./MemoColorSelector";
import { MemoLockDialog } from "./MemoLockDialog";
import { MemoReminderSelector } from "./MemoReminderSelector";
import { MemoCategorySelector } from "./MemoCategorySelector";
import { toast } from "@/components/ui/use-toast";
import { generateTagsWithGemini } from "@/services/aiTagService";

interface MemoEditorProps {
  memo: Memo;
  availableCategories: string[];
  onSave: (memo: Memo) => void;
  onCancel: () => void;
  onOrganize?: (memo: Memo) => void;
  isOrganizing?: boolean;
}

export const MemoEditor: React.FC<MemoEditorProps> = ({
  memo,
  availableCategories,
  onSave,
  onCancel,
  onOrganize,
  isOrganizing,
}) => {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content);
  const [importance, setImportance] = useState<"low" | "medium" | "high">(
    memo.importance || "medium"
  );
  const [color, setColor] = useState(memo.color || "");
  const [isLocked, setIsLocked] = useState(memo.isLocked || false);
  const [password, setPassword] = useState(memo.password || "");
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [tags, setTags] = useState<string[]>(memo.tags || []);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    memo.reminderDate
  );
  const [category, setCategory] = useState<string | undefined>(memo.category);
  const [newTag, setNewTag] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, handleImageUpload, handleImagePaste } = useImageUpload();

  // memo prop이 변경될 때 내부 state 동기화 (AI 정리 후 업데이트 반영)
  useEffect(() => {
    setTitle(memo.title);
    setContent(memo.content);
    setImportance(memo.importance || "medium");
    setColor(memo.color || "");
    setIsLocked(memo.isLocked || false);
    setPassword(memo.password || "");
    setTags(memo.tags || []);
    setReminderDate(memo.reminderDate);
    setCategory(memo.category);
  }, [memo]);

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
          description: "이미지가 메모에 추가되었습니다.",
        });
      }
    };

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [content, handleImagePaste]);

  const handleSave = () => {
    const updatedMemo: Memo = {
      ...memo,
      title: title.trim() || "제목 없음",
      content,
      importance,
      color,
      isLocked,
      password: isLocked ? password : undefined,
      tags,
      reminderDate,
      category,
      updatedAt: new Date(),
    };
    onSave(updatedMemo);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "오류",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageData = await handleImageUpload(file);
      const imageMarkdown = `\n![${file.name}](${imageData})\n`;
      setContent((prev) => prev + imageMarkdown);
      toast({
        title: "이미지 업로드 완료",
        description: `${file.name}이 메모에 추가되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleLock = (newPassword: string) => {
    setPassword(newPassword);
    setIsLocked(true);
    toast({
      title: "메모 잠금 설정",
      description: "메모가 성공적으로 잠겼습니다.",
    });
  };

  const handleUnlock = (inputPassword: string) => {
    if (inputPassword === password) {
      setIsLocked(false);
      setPassword("");
      toast({
        title: "메모 잠금 해제",
        description: "메모 잠금이 해제되었습니다.",
      });
      return true;
    }
    return false;
  };

  const generateTags = async () => {
    if (!content.trim()) {
      toast({
        title: "내용 없음",
        description: "태그를 생성할 메모 내용이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingTags(true);
    try {
      const generatedTags = await generateTagsWithGemini(content, "");
      setTags((prev) => [...new Set([...prev, ...generatedTags])]);
      toast({
        title: "태그 생성 완료",
        description: `${generatedTags.length}개의 태그가 생성되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "태그 생성 실패",
        description: "태그 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const addNewTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
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
            {uploading ? (
              <Upload className="w-4 h-4 animate-spin" />
            ) : (
              <Image className="w-4 h-4" />
            )}
            이미지
          </Button>
          <MemoReminderSelector
            reminderDate={reminderDate}
            onChange={setReminderDate}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLockDialog(true)}
          >
            {isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            {isLocked ? "잠금됨" : "잠금"}
          </Button>
          {onOrganize && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onOrganize({
                  ...memo,
                  title: title.trim() || "제목 없음",
                  content,
                  importance,
                  color,
                  isLocked,
                  password: isLocked ? password : undefined,
                  tags,
                  reminderDate,
                  category,
                  updatedAt: new Date(),
                })
              }
              disabled={isOrganizing || !content.trim()}
            >
              {isOrganizing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isOrganizing ? "정리 중..." : "AI 정리"}
            </Button>
          )}
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

      <div className="space-y-6">
        <div>
          <Input
            placeholder="메모 제목을 입력하세요..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MemoImportanceSelector
            importance={importance}
            onChange={setImportance}
          />
          <MemoColorSelector selectedColor={color} onChange={setColor} />
        </div>

        <MemoCategorySelector
          selectedCategory={category}
          availableCategories={availableCategories}
          onChange={setCategory}
        />

        <div>
          <Textarea
            ref={textareaRef}
            placeholder="여기에 메모를 자유롭게 작성하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] resize-none text-base leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">태그</label>
            <Button
              variant="outline"
              size="sm"
              onClick={generateTags}
              disabled={isGeneratingTags}
            >
              {isGeneratingTags ? "생성 중..." : "AI 태그 생성"}
            </Button>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            <Input
              placeholder="태그 직접 입력"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addNewTag()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addNewTag}
              disabled={!newTag.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1 cursor-pointer hover:bg-blue-200"
                onClick={() => removeTag(index)}
              >
                <span>#{tag}</span>
                <X className="w-3 h-3" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        마지막 수정: {memo.updatedAt.toLocaleString("ko-KR")}
      </div>

      <MemoLockDialog
        open={showLockDialog}
        onOpenChange={setShowLockDialog}
        isLocked={isLocked}
        onLock={handleLock}
        onUnlock={handleUnlock}
      />
    </div>
  );
};
