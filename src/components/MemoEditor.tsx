
import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Memo } from '@/types/memo';

interface MemoEditorProps {
  memo: Memo;
  onSave: (memo: Memo) => void;
  onCancel: () => void;
}

export const MemoEditor: React.FC<MemoEditorProps> = ({
  memo,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content);

  useEffect(() => {
    setTitle(memo.title);
    setContent(memo.content);
  }, [memo]);

  const handleSave = () => {
    const updatedMemo: Memo = {
      ...memo,
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date(),
      isOrganized: false, // Reset organized status when content is edited
    };
    onSave(updatedMemo);
  };

  const isChanged = title !== memo.title || content !== memo.content;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">메모 편집</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={!isChanged}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>저장</span>
          </button>
          <button
            onClick={onCancel}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
          >
            <X className="w-4 h-4" />
            <span>취소</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제목 (선택사항)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="메모 제목을 입력하세요..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="자유롭게 메모를 작성하세요! 특강이나 대화에서 나온 내용, 떠오른 생각들을 마음껏 적어보세요. AI가 나중에 깔끔하게 정리해드릴게요."
            rows={20}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>팁:</strong> 자유롭게 작성하세요! 완벽한 문장이 아니어도 괜찮습니다. 
          AI가 관심사별로 내용을 분류하고 가독성 있게 정리해드립니다.
        </p>
      </div>
    </div>
  );
};
